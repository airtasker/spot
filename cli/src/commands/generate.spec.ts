import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import Generate from "./generate";

const CONTRACT = path.join(__dirname, "../../../test-fixtures/contract/api.ts");

describe("generate", () => {
  jest.setTimeout(60000);

  const realIsTTY = process.stdin.isTTY;

  afterEach(() => {
    process.stdin.isTTY = realIsTTY;
    jest.restoreAllMocks();
  });

  function withoutTerminal(): void {
    process.stdin.isTTY = false;
  }

  async function failureFrom(argv: string[]): Promise<Error> {
    try {
      await Generate.run(argv);
    } catch (e) {
      return e as Error;
    }
    throw new Error(`Expected generate ${argv.join(" ")} to fail`);
  }

  test("exits 2 rather than prompting when there is no terminal", async () => {
    withoutTerminal();

    await expect(Generate.run(["-c", CONTRACT])).rejects.toMatchObject({
      oclif: { exit: 2 }
    });
  });

  test("names every missing flag, not just the first one", async () => {
    withoutTerminal();

    // One run should be enough for a caller to fix its invocation. Reporting
    // only `--generator` sends them round the loop three times.
    const error = await failureFrom(["-c", CONTRACT]);

    expect(error.message).toContain("--generator (-g)");
    expect(error.message).toContain("--language (-l)");
    expect(error.message).toContain("--out (-o)");
  });

  test("names only the flags that are actually missing", async () => {
    withoutTerminal();

    const error = await failureFrom([
      "-c",
      CONTRACT,
      "-g",
      "openapi3",
      "-l",
      "yaml"
    ]);

    expect(error.message).toContain("--out (-o)");
    expect(error.message).not.toContain("--generator");
    expect(error.message).not.toContain("--language");
  });

  test("reports the file it wrote, not the directory it was given", async () => {
    withoutTerminal();
    // realpath because macOS reaches the temp directory through a symlink,
    // and the command reports the resolved path.
    const outDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "spot-generate-"))
    );
    const log = jest.spyOn(process.stdout, "write").mockReturnValue(true);

    await Generate.run([
      "-c",
      CONTRACT,
      "-g",
      "openapi3",
      "-l",
      "yaml",
      "-o",
      outDir
    ]);

    const written = path.join(outDir, "api.yml");
    expect(fs.existsSync(written)).toBe(true);
    expect(log.mock.calls.map(call => String(call[0])).join("")).toContain(
      `Generated ${written}`
    );
  });
});
