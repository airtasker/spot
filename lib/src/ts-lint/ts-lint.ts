import { ESLint } from "eslint";
import * as fs from "fs";
import * as path from "path";
import { format } from "prettier/standalone";
import { createContractProject } from "../ts-project";
import { eslintConfig } from "./eslint-config";
import { prettierConfig } from "./prettier-config";

export interface TsLintOutcome {
  /** Lines to print, in formatting → lint → type order. */
  report: string[];
  /** Paths rewritten under `fix`. */
  fixed: string[];
  /** False when a problem that should fail the command remains. */
  ok: boolean;
}

export interface TsLintOptions {
  fix: boolean;
}

/**
 * Check a tree of Spot contracts for formatting, lint and type errors.
 *
 * Every step runs even when an earlier one has already found something, so a
 * single invocation reports everything wrong with the tree rather than the
 * first category of thing. A file Prettier cannot parse is reported against
 * that file and the remaining files are still checked, for the same reason.
 */
export async function tsLint(
  dir: string,
  { fix }: TsLintOptions
): Promise<TsLintOutcome> {
  // ESLint requires an absolute cwd, and absolute paths are what the report
  // should name — a relative one is meaningless once the output is read
  // somewhere other than the directory the command ran in.
  const root = path.resolve(dir);
  const files = collectContractFiles(root);
  if (files.length === 0) {
    // Not a pass: a renamed tree, an empty bind mount or a partial checkout all
    // look like this, and calling it success turns the gate into a no-op.
    return {
      report: [
        `No TypeScript files found under ${root}`,
        "  Nothing was checked. Pass the directory holding the contracts."
      ],
      fixed: [],
      ok: false
    };
  }

  const fixed = new Set<string>();

  // ESLint fixes before Prettier writes: an ESLint fix produces code, not
  // layout, so Prettier has to be the one to lay out whatever it produced.
  const lint = await runEslint(root, files, fix, fixed);
  const formatting = await runPrettier(files, fix, fixed);
  const types = runTypeCheck(files);

  return {
    report: [...formatting.report, ...lint.report, ...types],
    fixed: [...fixed].sort(),
    ok: formatting.ok && lint.ok && types.length === 0
  };
}

/**
 * Every `.ts` file under `dir`, skipping `node_modules` and any entry whose
 * name begins with a dot.
 *
 * Deliberately a walk of the tree rather than of the contract's import graph:
 * a contract file that nothing imports yet is exactly the file most likely to
 * be unformatted, and it must not pass by being invisible.
 */
function collectContractFiles(dir: string): string[] {
  const files: string[] = [];

  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
      } else if (entry.name.endsWith(".ts")) {
        files.push(full);
      }
    }
  };

  walk(dir);
  return files.sort();
}

async function runPrettier(
  files: string[],
  fix: boolean,
  fixed: Set<string>
): Promise<{ report: string[]; ok: boolean }> {
  const unformatted: string[] = [];
  const unparseable: string[] = [];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    let formatted: string;
    try {
      // `filepath` only labels the input for error messages; the parser is
      // named explicitly in the config, so this cannot change how the file is
      // formatted.
      formatted = await format(source, { ...prettierConfig, filepath: file });
    } catch (e) {
      // Unlike the other steps, Prettier throws rather than reporting. Name the
      // file and keep going, so one bad file does not discard every finding the
      // other steps have produced. Not `as Error`: a plugin is free to throw
      // anything, and a throw from in here would take down the whole run.
      const detail = e instanceof Error ? e.message : String(e);
      unparseable.push(`  ${file}: ${detail.split("\n")[0]}`);
      continue;
    }
    if (formatted === source) continue;

    if (fix) {
      fs.writeFileSync(file, formatted);
      fixed.add(file);
    } else {
      unformatted.push(file);
    }
  }

  const report: string[] = [];
  if (unformatted.length > 0) {
    report.push(
      `Formatting (${unformatted.length}):`,
      ...unformatted.map(file => `  ${file}`),
      "  Run with --fix to reformat."
    );
  }
  if (unparseable.length > 0) {
    report.push(`Unparseable (${unparseable.length}):`, ...unparseable);
  }

  return {
    report,
    ok: unformatted.length === 0 && unparseable.length === 0
  };
}

async function runEslint(
  dir: string,
  files: string[],
  fix: boolean,
  fixed: Set<string>
): Promise<{ report: string[]; ok: boolean }> {
  const eslint = new ESLint({
    cwd: dir,
    // The config is this package's own value and its plugins resolve from this
    // package's own node_modules, so an eslint.config.* beside the contract is
    // neither read nor needed.
    overrideConfigFile: true,
    overrideConfig: eslintConfig,
    fix
  });

  const results = await eslint.lintFiles(files);

  if (fix) {
    await ESLint.outputFixes(results);
    results
      .filter(result => result.output !== undefined)
      .forEach(result => fixed.add(result.filePath));
  }

  const errorCount = results.reduce((total, r) => total + r.errorCount, 0);
  const lines = results.flatMap(result =>
    result.messages.map(message => {
      const severity = message.severity === 2 ? "error" : "warning";
      const position = `${message.line ?? 0}:${message.column ?? 0}`;
      const rule = message.ruleId === null ? "" : ` (${message.ruleId})`;
      return `  ${result.filePath}:${position} ${severity} ${message.message}${rule}`;
    })
  );

  if (lines.length === 0) return { report: [], ok: true };

  // The header counts every message; only errors decide the exit. A
  // warning-only run therefore reports lines and still passes, which the CLI
  // distinguishes by not claiming the tree is clean whenever there is a report.
  return {
    report: [`Lint (${lines.length}):`, ...lines],
    ok: errorCount === 0
  };
}

/**
 * Type-check the contract tree under the same compiler options `parse` uses, so
 * a tree that clears this step also clears the type-check `parse` performs.
 * Contract-level errors — a missing `@api`, an unsupported type — are still
 * `validate`'s job.
 *
 * There is no emit: the diagnostics are the whole product.
 */
function runTypeCheck(files: string[]): string[] {
  const project = createContractProject();
  files.forEach(file => project.addSourceFileAtPath(file));
  project.resolveSourceFileDependencies();

  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length === 0) return [];

  return [
    `Types (${diagnostics.length}):`,
    ...diagnostics.map(diagnostic => {
      const messageText = diagnostic.getMessageText();
      const message =
        typeof messageText === "string"
          ? messageText
          : messageText.getMessageText();
      const file = diagnostic.getSourceFile()?.getFilePath() ?? "<unknown>";
      const line = diagnostic.getLineNumber();
      return `  ${file}${line === undefined ? "" : `:${line}`} - ${message}`;
    })
  ];
}
