import { cleanse } from "../cleansers/cleanser";
import { EndpointDefinition } from "../models/definitions";
import { TypeKind } from "../models/types/kinds"; //
import { parse } from "../parsers/parser";
import { hashContractDefinition } from "./hash";

describe("Hash", () => {
  describe("hashContractDefinition", () => {
    it("returns a consistent hash", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);
      const hash0 = hashContractDefinition(contractDefinition);
      const hash1 = hashContractDefinition(contractDefinition);
      expect(hash0).toEqual(hash1);
    });

    it("returns a new hash when a new endpoint is added", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      const endpointDefinition: EndpointDefinition = {
        name: "testEndpoint",
        description: "test endpoint",
        tags: ["test"],
        method: "GET",
        path: "/test",
        request: {
          headers: [],
          pathParams: [],
          queryParams: [],
          body: {
            description: "test response body",
            type: {
              kind: TypeKind.STRING
            }
          }
        },
        responses: [],
        tests: []
      };

      contractDefinition.endpoints.push(endpointDefinition);

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });

    it("returns a new hash when an endpoint request body gets udpated", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      contractDefinition.endpoints[0].request.body = {
        type: {
          kind: TypeKind.STRING
        }
      };

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });

    it("returns a new hash when an endpoint response body gets udpated", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      contractDefinition.endpoints[0].responses[0].description =
        "test response";

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });

    it("returns a new hash when an endpoint request header gets udpated", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      contractDefinition.endpoints[0].request.headers[0].description =
        "test request header";

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });

    it("returns a new hash when an endpoint request parameter gets udpated", () => {
      const result = parse("./lib/src/__examples__/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      contractDefinition.endpoints[0].request.pathParams[0].description =
        "test path parameter";

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });
  });
});
