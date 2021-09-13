import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";
import { Contract } from "./definitions";
import { parseContract } from "./parsers/contract-parser";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parse as parseJSON } from "comment-json";

export function parse(sourcePath: string, tsConfigFilePath?: string): Contract {
  const project = createProject(tsConfigFilePath);

  // Add all dependent files that the project requires
  const sourceFile = project.addSourceFileAtPath(sourcePath);
  project.resolveSourceFileDependencies();

  // Validate that the project has no TypeScript syntax errors
  validateProject(project);

  const result = parseContract(sourceFile);

  // TODO: print human readable errors
  if (result.isErr()) throw result.unwrapErr();

  return result.unwrap().contract;
}

/**
 * Create a new project configured for Spot
 */
function createProject(tsConfigFilePath?: string): Project {
  const resolvedTsConfigFilePath = resolve(
    tsConfigFilePath == null ? "./tsconfig.json" : tsConfigFilePath
  );

  const customConfig = readTsCompilerOptions(resolvedTsConfigFilePath);
  const compilerOptions = parseTsCompilerOptions(customConfig);

  // Creates a new typescript program in memory
  return new Project({
    compilerOptions,
    tsConfigFilePath: resolvedTsConfigFilePath
  });
}

/**
 * Retrieves a tsconfig.json from the specified or default path
 *
 * @param tsConfigFilePath string|null
 */
function readTsCompilerOptions(tsConfigFilePath?: string): CompilerOptions {
  if (tsConfigFilePath == null || !existsSync(tsConfigFilePath)) {
    return {};
  }

  const fileContents = readFileSync(tsConfigFilePath, "utf8");
  const parsedContents = parseJSON(fileContents, undefined, true);

  return parsedContents.compilerOptions;
}

/**
 * Parses a custom tsconfig by merging it with a default one.
 *
 * @param customConfig
 */
function parseTsCompilerOptions(
  customConfig: CompilerOptions
): CompilerOptions {
  const defaultConfig: CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    resolveJsonModule: true,
    alwaysStrict: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    baseUrl: "./",
    paths: {
      "@airtasker/spot": [path.join(__dirname, "../lib")]
    }
  };

  return {
    ...customConfig,
    ...defaultConfig,
    paths: {
      ...customConfig.paths,
      ...defaultConfig.paths
    }
  };
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
function validateProject(project: Project): void {
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics
        .map(diagnostic => {
          const message = diagnostic.getMessageText();
          return typeof message === "string"
            ? message
            : message.getMessageText();
        })
        .join("\n")
    );
  }
}
