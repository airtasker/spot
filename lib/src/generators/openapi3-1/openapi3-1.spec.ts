import fs from "fs";
import path from "path";
import { Contract, Endpoint } from "../../definitions";
import { parse } from "../../parser";
import {
  floatType,
  int32Type,
  referenceType,
  stringLiteralType,
  stringType,
  unionType
} from "../../types";
import { generateOpenAPI31 } from "./openapi3-1";
import * as validate from "./validate";
import { OpenApi31ComplianceError, validateOpenAPI31 } from "./validate";

const OPENAPI3_SPEC_EXAMPLES_DIR = path.join(
  __dirname,
  "../openapi3/__spec-examples__"
);

const OPENAPI31_SPEC_EXAMPLES_DIR = path.join(__dirname, "__spec-examples__");

const SNAPSHOT_CONTRACTS = [
  "contract-with-array-query-param-and-comma-serialization-strategy.ts",
  "contract-with-array-query-param.ts",
  "contract-with-delete-endpoint.ts",
  "contract-with-endpoint-metadata.ts",
  "contract-with-examples.ts",
  "contract-with-get-endpoint.ts",
  "contract-with-head-endpoint.ts",
  "contract-with-intersection-types.ts",
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
const UNSUPPORTED_CONTRACTS = ["contract-with-schemaprops.ts"];

const OPENAPI31_SNAPSHOT_CONTRACTS = [
  "contract-with-nested-discriminated-unions.ts",
  "contract-with-null-type.ts",
  "contract-with-nullable-intersections.ts",
  "contract-with-nullable-references.ts",
  "contract-with-nullable-types.ts",
  "contract-with-unions.ts"
];

function generateFromSpecExample(
  filename: string,
  dir = OPENAPI3_SPEC_EXAMPLES_DIR
) {
  return generateOpenAPI31(parse(path.join(dir, filename)));
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

  test("every openapi3.1 spec example is snapshotted", () => {
    expect(fs.readdirSync(OPENAPI31_SPEC_EXAMPLES_DIR).sort()).toEqual(
      [...OPENAPI31_SNAPSHOT_CONTRACTS].sort()
    );
  });

  describe.each([
    ...SNAPSHOT_CONTRACTS.map(filename => [
      filename,
      OPENAPI3_SPEC_EXAMPLES_DIR
    ]),
    ...OPENAPI31_SNAPSHOT_CONTRACTS.map(filename => [
      `openapi3-1/${filename}`,
      OPENAPI31_SPEC_EXAMPLES_DIR
    ])
  ])("%s", (name, dir) => {
    let result: ReturnType<typeof generateOpenAPI31>;

    beforeAll(() => {
      result = generateFromSpecExample(path.basename(name), dir);
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

    test("passes the self-check with no warnings", () => {
      expect(validateOpenAPI31(result)).toEqual({ errors: [], warnings: [] });
    });
  });

  test.each(UNSUPPORTED_CONTRACTS)("%s is rejected", filename => {
    expect(() => generateFromSpecExample(filename)).toThrow(
      "is not supported by the OpenAPI 3.1 generator"
    );
  });

  test("a parsed union whose members share a leaf is not discriminated", () => {
    const result = generateFromSpecExample(
      "contract-with-nested-discriminated-unions.ts",
      OPENAPI31_SPEC_EXAMPLES_DIR
    );

    expect(result.components?.schemas?.Body.properties?.diamond).toStrictEqual({
      oneOf: [
        { $ref: "#/components/schemas/Left" },
        { $ref: "#/components/schemas/Right" }
      ]
    });
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

  describe("self-check", () => {
    const contractWithServerDefault = (defaultValue: string) =>
      contractWith({
        oa3servers: [
          {
            url: "https://example.com:{port}",
            oa3ServerVariables: [
              {
                parameterName: "port",
                defaultValue,
                type: unionType([
                  stringLiteralType("80"),
                  stringLiteralType("443")
                ])
              }
            ]
          }
        ]
      });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("a non-conforming document is rejected with every violation", () => {
      expect(() =>
        generateOpenAPI31(contractWithServerDefault("8080"))
      ).toThrow(
        new OpenApi31ComplianceError([
          {
            path: "/servers/0/variables/port/default",
            message:
              'default "8080" is not one of the variable\'s enum values ["80","443"]'
          }
        ])
      );
    });

    test("a conforming document is returned", () => {
      expect(
        generateOpenAPI31(contractWithServerDefault("443")).servers
      ).toStrictEqual([
        {
          url: "https://example.com:{port}",
          variables: { port: { default: "443", enum: ["80", "443"] } }
        }
      ]);
    });

    test("warnings are passed to onWarning and do not fail generation", () => {
      const warning = { path: "/components/schemas/A/oneOf", message: "w" };
      jest
        .spyOn(validate, "validateOpenAPI31")
        .mockReturnValue({ errors: [], warnings: [warning] });
      const onWarning = jest.fn();

      const result = generateOpenAPI31(contractWith({}), { onWarning });

      expect(result.openapi).toBe("3.1.0");
      expect(onWarning.mock.calls).toEqual([[warning]]);
    });

    test("a union with overlapping members is generated with a warning", () => {
      const onWarning = jest.fn();

      const result = generateOpenAPI31(
        contractWith({
          types: [
            {
              name: "Amount",
              typeDef: { type: unionType([int32Type(), floatType()]) }
            }
          ]
        }),
        { onWarning }
      );

      expect(result.components?.schemas?.Amount).toStrictEqual({
        oneOf: [
          { type: "integer", format: "int32" },
          { type: "number", format: "float" }
        ]
      });
      expect(onWarning.mock.calls).toEqual([
        [
          {
            path: "/components/schemas/Amount/oneOf",
            message:
              "members 0 and 1 can match the same value, so that value matches more than one oneOf branch"
          }
        ]
      ]);
    });

    test("validates the normalised document", () => {
      const spy = jest.spyOn(validate, "validateOpenAPI31");

      const result = generateOpenAPI31(contractWith({}));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(result);
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
