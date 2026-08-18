import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { tsLint } from "./ts-lint";

const FIXTURES = path.join(__dirname, "../../../test-fixtures/ts-lint");
const CLEAN = path.join(FIXTURES, "clean");
const DIRTY = path.join(FIXTURES, "dirty");

const NAMING_ERROR = "@typescript-eslint/naming-convention";
const TYPE_ERROR = "Type 'string' is not assignable to type 'number'";

function copyFixture(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spot-ts-lint-"));
  fs.cpSync(path.join(FIXTURES, name), dir, { recursive: true });
  return dir;
}

describe("tsLint", () => {
  jest.setTimeout(60000);

  test("reports nothing for a tree that is formatted, clean and type-safe", async () => {
    const outcome = await tsLint(CLEAN, { fix: false });

    expect(outcome.report).toEqual([]);
    expect(outcome.fixed).toEqual([]);
    expect(outcome.ok).toBe(true);
  });

  test("reports all three kinds of problem from one run", async () => {
    // The formatting step finding something must not stop the lint or type
    // steps: a contributor who runs this once should see everything at once.
    const report = (await tsLint(DIRTY, { fix: false })).report.join("\n");

    expect(report).toContain("Formatting (2):");
    expect(report).toContain(NAMING_ERROR);
    expect(report).toContain(TYPE_ERROR);
  });

  test("does not write to the tree without fix", async () => {
    const dir = copyFixture("dirty");
    const before = fs.readFileSync(path.join(dir, "api.ts"), "utf8");

    await tsLint(dir, { fix: false });

    expect(fs.readFileSync(path.join(dir, "api.ts"), "utf8")).toBe(before);
  });

  test("fix reformats, and leaves the problems it cannot repair", async () => {
    const dir = copyFixture("dirty");

    const fixRun = await tsLint(dir, { fix: true });
    expect(fixRun.fixed.map(f => path.basename(f)).sort()).toEqual([
      "api.ts",
      "models.ts"
    ]);

    const afterFix = await tsLint(dir, { fix: false });
    const report = afterFix.report.join("\n");
    expect(report).not.toContain("Formatting");
    // Neither a name nor a type is something a fixer may choose on the
    // author's behalf, so both survive and the command still fails.
    expect(report).toContain(NAMING_ERROR);
    expect(report).toContain(TYPE_ERROR);
    expect(afterFix.ok).toBe(false);
  });

  test("ignores lint and formatting config left beside the contract", async () => {
    const dir = copyFixture("clean");
    fs.writeFileSync(
      path.join(dir, ".prettierrc"),
      JSON.stringify({ singleQuote: false, tabWidth: 8 })
    );
    fs.writeFileSync(
      path.join(dir, "eslint.config.mjs"),
      // A rule the bundled config never mentions, on a construct the fixture
      // has four of. `no-undef` would not do: the bundled config's TypeScript
      // preset switches it off again, so a leftover config that *was* read
      // would still report nothing and this test would pass either way.
      "export default [{ rules: { 'no-restricted-syntax': ['error', " +
        "{ selector: 'TSInterfaceDeclaration', message: 'leftover config was read' }] } }];\n"
    );

    const outcome = await tsLint(dir, { fix: false });

    expect(outcome.report).toEqual([]);
    expect(outcome.ok).toBe(true);
  });

  test("fails a directory that holds no contracts", async () => {
    // Distinct from a directory that does not exist, which fails from readdir.
    // A tree that has been renamed, arrived empty in a bind mount, or been
    // partially checked out looks like this, and calling it a pass turns the
    // gate into a no-op that a green pipeline cannot reveal.
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "spot-ts-lint-empty-"));

    const outcome = await tsLint(empty, { fix: false });

    expect(outcome.ok).toBe(false);
    expect(outcome.report.join("\n")).toContain("Nothing was checked");
  });

  test("a file Prettier cannot parse does not discard the other findings", async () => {
    const dir = copyFixture("dirty");
    fs.writeFileSync(path.join(dir, "zz-broken.ts"), "export const = ;\n");

    const outcome = await tsLint(dir, { fix: false });
    const report = outcome.report.join("\n");

    // The unparseable file is named, rather than surfacing as a bare parse
    // error with a line number and no path.
    expect(report).toContain("zz-broken.ts");
    // And the steps that had already run still report.
    expect(report).toContain(NAMING_ERROR);
    expect(report).toContain(TYPE_ERROR);
    expect(outcome.ok).toBe(false);
  });

  test("does not report type errors from inside node_modules", async () => {
    const dir = copyFixture("clean");
    // Resolving the tree's imports reaches into node_modules, and a declaration
    // file there can carry its own errors. A contract author cannot edit them
    // and --fix cannot reach them, so reporting them would be a standing
    // failure with no move against it.
    const pkg = path.join(dir, "node_modules", "junk");
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, "package.json"),
      JSON.stringify({ name: "junk", version: "1.0.0", types: "index.d.ts" })
    );
    fs.writeFileSync(
      path.join(pkg, "index.d.ts"),
      "export declare const bad: number;\nexport declare const worse: number = 'no';\n"
    );
    fs.writeFileSync(
      path.join(dir, "uses-junk.ts"),
      "import { bad } from 'junk';\n\nexport const value = bad;\n"
    );

    const outcome = await tsLint(dir, { fix: false });

    expect(outcome.report.join("\n")).not.toContain("node_modules");
    expect(outcome.ok).toBe(true);
  });

  test("checks a contract file that nothing imports", async () => {
    const dir = copyFixture("clean");
    // Reached by walking the tree, not by following the contract's imports —
    // an endpoint that has not been wired into api.ts yet is precisely the one
    // most likely to be unformatted.
    fs.writeFileSync(path.join(dir, "orphan.ts"), "export const  x = 1;\n");

    const outcome = await tsLint(dir, { fix: false });

    expect(outcome.report.join("\n")).toContain("orphan.ts");
    expect(outcome.ok).toBe(false);
  });
});
