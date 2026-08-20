import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import TsLint from "./ts-lint";

const FIXTURES = path.join(__dirname, "../../../test-fixtures/ts-lint");

/**
 * The exit code is the whole of this command's contract with CI: a consumer's
 * pipeline reads nothing else. It is also the part a unit test on `tsLint`
 * cannot reach, because the mapping from an outcome to an exit lives here.
 */
describe("ts-lint command", () => {
  jest.setTimeout(60000);

  // Typed off the property rather than spelled out: node widened `exitCode` to
  // allow a string and null, and this is only ever a saved copy of it.
  let restoreExitCode: typeof process.exitCode;
  let out: string;
  let writeSpy: jest.SpyInstance;

  beforeEach(() => {
    restoreExitCode = process.exitCode;
    process.exitCode = undefined;
    out = "";
    writeSpy = jest
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk: unknown) => {
        out += String(chunk);
        return true;
      });
  });

  afterEach(() => {
    // Restored first: a throw from mockRestore would otherwise leak a non-zero
    // exit code, which reports as a wholly green suite that exits 1.
    process.exitCode = restoreExitCode;
    writeSpy.mockRestore();
  });

  test("exits zero and says so on a clean tree", async () => {
    await TsLint.run([path.join(FIXTURES, "clean")]);

    expect(process.exitCode).toBeUndefined();
    expect(out).toContain("No problems found");
  });

  test("exits one on a tree with problems, reporting every category", async () => {
    await TsLint.run([path.join(FIXTURES, "dirty")]);

    expect(process.exitCode).toBe(1);
    expect(out).toContain("Formatting (");
    expect(out).toContain("Lint (");
    expect(out).toContain("Types (");
    // A run that found something must not also claim the tree is clean.
    expect(out).not.toContain("No problems found");
  });

  test("exits one when the directory holds no contracts", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "spot-ts-lint-empty-"));

    await TsLint.run([empty]);

    expect(process.exitCode).toBe(1);
    expect(out).toContain("Nothing was checked");
  });
});
