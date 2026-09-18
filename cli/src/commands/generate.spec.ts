import * as fs from "fs";
import inquirer from "inquirer";
import * as os from "os";
import * as path from "path";
import Generate from "./generate";

// The command imports the default export, so that is what the mock stands in for.
jest.mock("inquirer", () => ({
  __esModule: true,
  default: { prompt: jest.fn() }
}));

const promptMock = inquirer.prompt as unknown as jest.Mock;

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
  test("inquirer resolves as CommonJS and still exposes the legacy prompt", () => {
    // Every other case here runs against the mock, so the suite would pass
    // against a module that cannot be loaded at all — which is the shape an
    // ESM-only inquirer takes in a CommonJS package. `jest.requireActual`
    // bypasses the factory above. The manifest is read from disk rather than
    // required, because inquirer's `exports` map does not expose
    // `./package.json`.
    const actual = jest.requireActual("inquirer");
    expect(typeof (actual.default ?? actual).prompt).toBe("function");

    let dir = path.dirname(require.resolve("inquirer"));
    while (!fs.existsSync(path.join(dir, "package.json"))) {
      dir = path.dirname(dir);
    }
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dir, "package.json"), "utf8")
    );
    expect(manifest.type ?? "commonjs").not.toBe("module");
  });

  test("asks for each flag under the label the command fixes", async () => {
    // The compiler already requires `message` and `type` to be present — both
    // are non-optional on inquirer's question type. What it cannot check is the
    // text, and the text is what a user reads, so it is pinned here.
    withTerminal();
    const outDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "spot-generate-labels-"))
    );
    promptMock
      .mockResolvedValueOnce({ Generator: "openapi3" })
      .mockResolvedValueOnce({ Language: "yaml" })
      .mockResolvedValueOnce({ "Output destination": outDir });
    jest.spyOn(console, "log").mockImplementation(() => undefined);

    await Generate.run(["-c", CONTRACT]);

    expect(
      promptMock.mock.calls.map(([question]) => [
        question.name,
        question.message,
        question.type
      ])
    ).toEqual([
      ["Generator", "Generator:", "list"],
      ["Language", "Language:", "list"],
      ["Output destination", "Output destination:", "input"]
    ]);
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
