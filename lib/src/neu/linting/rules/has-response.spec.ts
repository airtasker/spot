import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { hasResponse } from "./has-response";

describe("has-response linter rule", () => {
  test("returns violations for endpoint with no responses", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response/endpoint-with-no-responses.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = hasResponse(contract);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual(
      "Endpoint (Endpoint) does not declare any response"
    );
  });

  test("returns no violations for endpoint with only a specific response", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response/endpoint-with-specific-response.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasResponse(contract)).toHaveLength(0);
  });

  test("returns no violations for endpoint with only a default response", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response/endpoint-with-default-response.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasResponse(contract)).toHaveLength(0);
  });
});
