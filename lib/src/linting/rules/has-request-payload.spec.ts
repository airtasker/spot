import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { hasRequestPayload } from "./has-request-payload";

describe("has-request-payload linter rule", () => {
  describe("HTTP GET", () => {
    test("returns violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/get-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasRequestPayload(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (GetEndpoint) with HTTP method GET must not contain a request body"
      );
    });
    test("returns no violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/get-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
  });

  describe("HTTP HEAD", () => {
    test("returns violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/head-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasRequestPayload(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (HeadEndpoint) with HTTP method HEAD must not contain a request body"
      );
    });
    test("returns no violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/head-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
  });

  describe("HTTP POST", () => {
    test("returns no violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/post-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
    test("returns violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/post-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasRequestPayload(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PostEndpoint) with HTTP method POST must contain a request body"
      );
    });
  });

  describe("HTTP PATCH", () => {
    test("returns no violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/patch-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
    test("returns violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/patch-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasRequestPayload(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PatchEndpoint) with HTTP method PATCH must contain a request body"
      );
    });
  });

  describe("HTTP PUT", () => {
    test("returns no violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/put-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
    test("returns violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/put-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const result = hasRequestPayload(contract);
      expect(result).toHaveLength(1);
      const message = result[0].message;
      expect(message).toEqual(
        "Endpoint (PutEndpoint) with HTTP method PUT must contain a request body"
      );
    });
  });

  describe("HTTP DELETE", () => {
    test("returns no violations for endpoint with a request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/delete-endpoint-with-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
    test("returns no violations for endpoint with no request body", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/has-request-payload/delete-endpoint-without-request-body.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      expect(hasRequestPayload(contract)).toHaveLength(0);
    });
  });
});
