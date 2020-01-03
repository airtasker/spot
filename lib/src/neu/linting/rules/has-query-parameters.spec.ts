import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { hasQueryParameters } from "./has-query-parameters";

describe("has-request-payload linter rule", () => {
  describe("HTTP PATCH", () => {
    test("returns violations for endpoint with query parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/patch-endpoint-with-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasQueryParameters(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PatchEndpoint) with HTTP method PATCH must not contain query parameters"
      );
    });
    test("returns no violations for endpoint with no query parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/patch-endpoint-without-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasQueryParameters(contract)).toHaveLength(0);
    });
  });

  describe("HTTP POST", () => {
    test("returns violations for endpoint with quey parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/post-endpoint-with-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasQueryParameters(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PostEndpoint) with HTTP method POST must not contain query parameters"
      );
    });
    test("returns no violations for endpoint with no query parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/post-endpoint-without-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasQueryParameters(contract)).toHaveLength(0);
    });
  });

  describe("HTTP PUT", () => {
    test("returns violations for endpoint with quey parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/put-endpoint-with-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasQueryParameters(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PutEndpoint) with HTTP method PUT must not contain query parameters"
      );
    });
    test("returns no violations for endpoint with no query parameters", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-query-parameters/put-endpoint-without-query-parameters.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasQueryParameters(contract)).toHaveLength(0);
    });
  });
});
