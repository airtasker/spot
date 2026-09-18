import * as path from "path";
import Lint from "./lint";

const FIXTURES = path.join(
  __dirname,
  "../../../lib/src/linting/rules/__spec-examples__/no-trailing-forward-slash"
);
const WITH_WARNING = path.join(FIXTURES, "trailing-forward-slash.ts");

/**
 * `no-trailing-forward-slash` is `warn` in the command's default config, so a
 * plain `spot lint` on this fixture takes the warning path — the one that has
 * no coverage anywhere else. `check-image-parity` lints a clean contract and
 * escalates the rule to `error`, so both of its cases step around it.
 *
 * Nothing here exercises an error-severity violation: the command answers that
 * with `process.exit(1)`, which would take the jest worker with it.
 */
describe("lint command", () => {
  jest.setTimeout(60000);

  let out: string;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    out = "";
    logSpy = jest
      .spyOn(console, "log")
      .mockImplementation((...args: unknown[]) => {
        out += args.map(String).join(" ") + "\n";
      });
    warnSpy = jest
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        out += args.map(String).join(" ") + "\n";
      });
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test("reports a warning and still succeeds", async () => {
    // `warn` reaches the linter as a callback. Handed over unbound it throws on
    // `this`, which fails the whole command rather than warning.
    await Lint.run([WITH_WARNING]);

    expect(out).toContain("trailing forward slash");
    expect(out).toContain("Found 0 errors and 1 warnings");
  });

  test("takes the rule out with off", async () => {
    await Lint.run([WITH_WARNING, "--no-trailing-forward-slash=off"]);

    expect(out).toContain("Found 0 errors and 0 warnings");
  });

  test("rejects a severity outside the allowed set", async () => {
    // The v1 `flags.enum` restriction, carried over as `Flags.string({ options })`.
    await expect(
      Lint.run([WITH_WARNING, "--no-trailing-forward-slash=bogus"])
    ).rejects.toThrow(/Expected .* to be one of/);
  });
});
