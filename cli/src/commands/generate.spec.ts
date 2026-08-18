import * as fs from "fs";
import { prompt } from "inquirer";
import * as os from "os";
import * as path from "path";
import Generate from "./generate";

jest.mock("inquirer", () => ({ prompt: jest.fn() }));

const promptMock = prompt as unknown as jest.Mock;

const CONTRACT = path.join(__dirname, "../../../test-fixtures/contract/api.ts");

describe("generate", () => {
  jest.setTimeout(60000);

  const realIsTTY = process.stdin.isTTY;

  afterEach(() => {
    process.stdin.isTTY = realIsTTY;
    promptMock.mockReset();
    jest.restoreAllMocks();
  });

  function withoutTerminal(): void {
    process.stdin.isTTY = false;
  }

  function withTerminal(): void {
    process.stdin.isTTY = true;
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
  test("prompts for the missing flags when there is a terminal", async () => {
    // The other cases all sit on the no-terminal side of the guard, so without
    // this one the condition itself is unconstrained: making it unconditional
    // keeps them all green while destroying every interactive invocation.
    withTerminal();
    const outDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "spot-generate-tty-"))
    );
    promptMock
      .mockResolvedValueOnce({ Generator: "openapi3" })
      .mockResolvedValueOnce({ Language: "yaml" })
      .mockResolvedValueOnce({ "Output destination": outDir });
    jest.spyOn(process.stdout, "write").mockReturnValue(true);

    await Generate.run(["-c", CONTRACT]);

    expect(promptMock).toHaveBeenCalledTimes(3);
    expect(fs.existsSync(path.join(outDir, "api.yml"))).toBe(true);
  });
});
