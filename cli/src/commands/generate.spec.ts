import * as fs from "fs";
import { prompt } from "inquirer";
import YAML from "js-yaml";
import * as os from "os";
import * as path from "path";
import Generate from "./generate";

jest.mock("inquirer", () => ({ prompt: jest.fn() }));

const promptMock = prompt as unknown as jest.Mock;

const CONTRACT = path.join(__dirname, "../../../test-fixtures/contract/api.ts");
const OPENAPI31_EXAMPLES = path.join(
  __dirname,
  "../../../lib/src/generators/openapi3-1/__spec-examples__"
);

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

  describe("openapi3.1", () => {
    function tempDir(): string {
      return fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), "spot-generate-openapi31-"))
      );
    }

    test.each([
      ["json", "api.json", JSON.parse],
      ["yaml", "api.yml", (text: string) => YAML.load(text)]
    ])(
      "writes an OpenAPI 3.1 document as %s",
      async (language, filename, load) => {
        withoutTerminal();
        const outDir = tempDir();
        jest.spyOn(process.stdout, "write").mockReturnValue(true);

        await Generate.run([
          "-c",
          CONTRACT,
          "-g",
          "openapi3.1",
          "-l",
          language,
          "-o",
          outDir
        ]);

        const written = fs.readFileSync(path.join(outDir, filename), "utf8");
        expect(load(written)).toMatchObject({ openapi: "3.1.0" });
      }
    );

    test("prints each self-check warning and still writes the document", async () => {
      withoutTerminal();
      const outDir = tempDir();
      jest.spyOn(process.stdout, "write").mockReturnValue(true);
      const warn = jest
        .spyOn(Generate.prototype, "warn")
        .mockImplementation(input => input);

      await Generate.run([
        "-c",
        path.join(
          OPENAPI31_EXAMPLES,
          "contract-with-overlapping-nullable-members.ts"
        ),
        "-g",
        "openapi3.1",
        "-l",
        "yaml",
        "-o",
        outDir
      ]);

      expect(warn.mock.calls).toEqual([
        [
          expect.stringMatching(
            /^\/components\/schemas\/Body\/properties\/pet\/oneOf: .*admit null/
          )
        ]
      ]);
      expect(
        fs.existsSync(
          path.join(outDir, "contract-with-overlapping-nullable-members.yml")
        )
      ).toBe(true);
    });

    test("fails, writing nothing, when the contract cannot be expressed", async () => {
      withoutTerminal();
      const outDir = path.join(tempDir(), "out");

      // An exclusive bound with no bound to make exclusive has no OpenAPI 3.1
      // form, so the generator rejects the contract.
      const error = await failureFrom([
        "-c",
        path.join(
          __dirname,
          "../../../lib/src/generators/openapi3/__spec-examples__/contract-with-schemaprops.ts"
        ),
        "-g",
        "openapi3.1",
        "-l",
        "yaml",
        "-o",
        outDir
      ]);

      expect(error.message).toContain('request header "size"');
      expect(error.message).toContain('"exclusiveMaximum"');
      expect(fs.existsSync(outDir)).toBe(false);
    });
  });
});
