import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { noNullableArrays } from "./no-nullable-arrays";

describe("no-nullable-arrays linter rule", () => {
  test("returns no violations for contract containing a non nullable array", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-nullable-arrays/non-nullable-array.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noNullableArrays(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing a nullable arrays", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-nullable-arrays/nullable-array.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noNullableArrays(contract)).toHaveLength(1);
  });

  test("returns violations for every nullable component of a contract", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-nullable-arrays/contract-with-nullable-violations-in-each-nullable-component.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = noNullableArrays(contract);
    expect(result).toHaveLength(3);
    const messages = result.map(v => v.message);
    expect(messages).toContain(
      "Endpoint (Endpoint) request body contains a nullable array type: #/array"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (200) body contains a nullable array type: #/array"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (default) body contains a nullable array type: #/array"
    );
  });
});
