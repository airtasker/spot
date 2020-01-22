import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { hasResponsePayload } from "./has-response-payload";

describe("has-response-payload linter rule", () => {
  test("returns violations for endpoint specific response with no response body", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response-payload/endpoint-specific-response-without-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = hasResponsePayload(contract);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual(
      "Endpoint (Endpoint) response for status 200 is missing a response body"
    );
  });

  test("returns violations for endpoint default response with no response body", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response-payload/endpoint-default-response-without-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = hasResponsePayload(contract);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual(
      "Endpoint (Endpoint) default response is missing a response body"
    );
  });

  test("returns no violations for endpoint specific or default response with a response body", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-response-payload/endpoint-specific-and-default-responses-with-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasResponsePayload(contract)).toHaveLength(0);
  });
});
