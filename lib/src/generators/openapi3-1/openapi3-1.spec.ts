import fs from "fs";
import path from "path";
import { Contract, Endpoint } from "../../definitions";
import { parse } from "../../parser";
import { referenceType, stringType } from "../../types";
import { generateOpenAPI31 } from "./openapi3-1";

const OPENAPI3_SPEC_EXAMPLES_DIR = path.join(
  __dirname,
  "../openapi3/__spec-examples__"
);

const SNAPSHOT_CONTRACTS = [
  "contract-with-array-query-param-and-comma-serialization-strategy.ts",
  "contract-with-array-query-param.ts",
  "contract-with-delete-endpoint.ts",
  "contract-with-endpoint-metadata.ts",
  "contract-with-examples.ts",
  "contract-with-get-endpoint.ts",
  "contract-with-head-endpoint.ts",
  "contract-with-multiple-servers.ts",
  "contract-with-object-query-param.ts",
  "contract-with-one-server.ts",
  "contract-with-patch-endpoint.ts",
  "contract-with-path-params.ts",
  "contract-with-post-endpoint.ts",
  "contract-with-put-endpoint.ts",
  "contract-with-query-params.ts",
  "contract-with-request-headers.ts",
  "contract-with-response-headers.ts",
  "contract-with-security-header.ts",
  "contract-with-specific-and-default-responses.ts",
  "minimal-contract.ts",
  "versioned-contract.ts"
];

// Contracts that use shapes this generator rejects.
const UNSUPPORTED_CONTRACTS = [
  "contract-with-intersection-types.ts",
  "contract-with-schemaprops.ts"
];

function generateFromSpecExample(filename: string) {
  return generateOpenAPI31(
    parse(path.join(OPENAPI3_SPEC_EXAMPLES_DIR, filename))
  );
}

function contractWith(overrides: Partial<Contract>): Contract {
  return {
    name: "contract",
    config: { paramSerializationStrategy: { query: { array: "ampersand" } } },
    types: [],
    endpoints: [],
    ...overrides
  };
}

function endpointWith(overrides: Partial<Endpoint>): Endpoint {
  return {
    name: "getUser",
    tags: [],
    method: "GET",
    path: "/user",
    responses: [],
    draft: false,
    ...overrides
  };
}

describe("OpenAPI 3.1 generator", () => {
  test("every openapi3 spec example is either snapshotted or listed as unsupported", () => {
    expect(fs.readdirSync(OPENAPI3_SPEC_EXAMPLES_DIR).sort()).toEqual(
      [...SNAPSHOT_CONTRACTS, ...UNSUPPORTED_CONTRACTS].sort()
    );
  });

  describe.each(SNAPSHOT_CONTRACTS)("%s", filename => {
    let result: ReturnType<typeof generateOpenAPI31>;

    beforeAll(() => {
      result = generateFromSpecExample(filename);
    });

    test("matches the snapshot", () => {
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    });

    test("declares OpenAPI 3.1.0", () => {
      expect(result.openapi).toBe("3.1.0");
    });

    test("is plain JSON data", () => {
      expect(result).toStrictEqual(JSON.parse(JSON.stringify(result)));
    });
  });

  test.each(UNSUPPORTED_CONTRACTS)("%s is rejected", filename => {
    expect(() => generateFromSpecExample(filename)).toThrow(
      "is not supported by the OpenAPI 3.1 generator"
    );
  });

  test("keeps a component description beside $ref", () => {
    const result = generateOpenAPI31(
      contractWith({
        types: [
          { name: "Name", typeDef: { type: stringType() } },
          {
            name: "Alias",
            typeDef: { type: referenceType("Name"), description: "an alias" }
          }
        ]
      })
    );

    expect(result.components?.schemas?.Alias).toStrictEqual({
      $ref: "#/components/schemas/Name",
      description: "an alias"
    });
  });

  describe("responses", () => {
    test("an endpoint with no response is rejected", () => {
      expect(() =>
        generateOpenAPI31(contractWith({ endpoints: [endpointWith({})] }))
      ).toThrow(
        "Endpoint (getUser) does not declare any response. OpenAPI 3.1 requires at least one response per operation."
      );
    });

    test("an endpoint with only a default response is accepted", () => {
      const result = generateOpenAPI31(
        contractWith({
          endpoints: [endpointWith({ defaultResponse: { headers: [] } })]
        })
      );

      expect(result.paths["/user"].get?.responses).toStrictEqual({
        default: { description: "default response" }
      });
    });
  });
});
