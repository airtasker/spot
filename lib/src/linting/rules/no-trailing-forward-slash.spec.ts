import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { noTrailingForwardSlash } from "./no-trailing-forward-slash";

describe("no-trailing-forward-slash linter rule", () => {
  test("returns no violations for contract not containing a trailing forward slash", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-trailing-forward-slash/no-trailing-forward-slash.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noTrailingForwardSlash(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing a trailing forward slash", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-trailing-forward-slash/trailing-forward-slash.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noTrailingForwardSlash(contract)).toHaveLength(1);
  });
});
