import { createSourceFile } from "./helper";

describe("createSourceFile", () => {
  /**
   * `validateProject` rejects a source file with any pre-emit diagnostic, and
   * every parser and linting spec leans on it to reject a bad fixture. The
   * options it checks under come from `contractCompilerOptions`, which includes
   * `skipLibCheck`, so the gate is narrower than "no diagnostics at all" — these
   * two cases pin that it still fails on an error in the contract itself.
   */
  it("rejects a contract with a type error", () => {
    expect(() =>
      createSourceFile({
        path: "main",
        content: 'export const answer: number = "forty-two";\n'
      })
    ).toThrow();
  });

  it("accepts a contract that type-checks", () => {
    expect(() =>
      createSourceFile({
        path: "main",
        content: "export const answer: number = 42;\n"
      })
    ).not.toThrow();
  });
});
