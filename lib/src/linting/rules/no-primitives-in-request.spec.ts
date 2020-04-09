import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { noPrimitivesInRequest } from "./no-primitives-in-request";

describe("no-primitives-in-request linter rule", () => {
  test("returns violations for endpoint with a request as primitives", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-primitives-in-request/request-with-primitives.ts`
    ).file;
    const { contract } = parseContract(file).unwrapOrThrow();
    const result = noPrimitivesInRequest(contract);
    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual(
      "Endpoint (Endpoint) must contain a request as an object"
    );
  });

  test("returns violations for endpoint with a request as array", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-primitives-in-request/request-as-array.ts`
    ).file;
    const { contract } = parseContract(file).unwrapOrThrow();
    const result = noPrimitivesInRequest(contract);
    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual(
      "Endpoint (Endpoint) must contain a request as an object"
    );
  });

  test("returns no violations for endpoint with a request as object", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-primitives-in-request/request-as-object.ts`
    ).file;
    const { contract } = parseContract(file).unwrapOrThrow();
    expect(noPrimitivesInRequest(contract)).toHaveLength(0);
  });
});
