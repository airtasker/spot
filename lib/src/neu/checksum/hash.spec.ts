import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { Endpoint } from "../definitions";
import { parseContract } from "../parsers/contract-parser";
import { TypeKind } from "../types";
import { hashContract } from "./hash";

describe("Hash", () => {
  describe("hashContract", () => {
    it("returns a consistent hash", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/contract.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const hash0 = hashContract(contract);
      const hash1 = hashContract(contract);

      expect(hash0).toEqual(hash1);
    });

    it("returns a new hash when a new endpoint is added", () => {
      const file = createProjectFromExistingSourceFile(
        `${__dirname}/__spec-examples__/contract.ts`
      ).file;

      const { contract } = parseContract(file).unwrapOrThrow();

      const hash0 = hashContract(contract);

      const endpointDefinition: Endpoint = {
        name: "testEndpoint",
        description: "test endpoint",
        draft: false,
        tags: ["test"],
        method: "GET",
        path: "/test",
        request: {
          headers: [],
          pathParams: [],
          queryParams: [],
          body: {
            type: {
              kind: TypeKind.STRING
            }
          }
        },
        responses: []
      };

      contract.endpoints.push(endpointDefinition);

      const hash1 = hashContract(contract);

      expect(hash0).not.toEqual(hash1);
    });
  });
});
