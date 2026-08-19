import {
  Document,
  ISpectralDiagnostic,
  RulesetDefinition,
  Spectral
} from "@stoplight/spectral-core";
import { Json } from "@stoplight/spectral-parsers";
import { oas } from "@stoplight/spectral-rulesets";
import { Contract } from "../../definitions";
import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { generateOpenAPI3 } from "./openapi3";

describe("OpenAPI 3 generator", () => {
  /**
   * The OpenAPI rules every generated document is held to.
   *
   * `oas` is pulled in with every rule off and only the rules named here are
   * turned back on, so a rule starts applying only by being added to this list.
   * The set is deliberately narrower than `oas`: a generated document has no
   * author to satisfy style rules such as `info-description` or
   * `operation-tags`.
   *
   * The rules inherited from `oas` carry their own `formats`, which is what
   * decides whether each one applies to a given document. A document spectral
   * cannot place reports `unrecognized-format`, so the empty-findings
   * assertions below fail on it rather than passing vacuously.
   */
  const ruleset: RulesetDefinition = {
    extends: [[oas as RulesetDefinition, "off"]],
    rules: {
      // `operation-2xx-response` under spectral 5.
      "operation-success-response": true,
      "operation-operationId-unique": true,
      "operation-parameters": true,
      "path-params": true,
      "oas3-examples-value-or-externalValue": true,
      "no-eval-in-markdown": true,
      "no-script-tags-in-markdown": true,
      "openapi-tags-alphabetical": true,
      "operation-operationId-valid-in-url": true,
      "path-declarations-must-exist": true,
      "path-keys-no-trailing-slash": true,
      "path-not-include-query": true,
      "typed-enum": true,
      "oas3-operation-security-defined": true,
      "oas3-server-not-example.com": true,
      "oas3-server-trailing-slash": true,
      // `oas3-unused-components-schema` under spectral 5.
      "oas3-unused-component": true,
      // Neither of these ran before. The old ruleset named `oas3-valid-example`,
      // which spectral 5 did not have, and an unknown name was ignored rather
      // than reported — so example validation was never on. The media half is
      // enabled here; the schema half reports six standing findings against the
      // schemaprops contract, so it waits on the generator fix in
      // https://airtasker.atlassian.net/browse/COMPASS-29
      "oas3-valid-media-example": true,
      "oas3-valid-schema-example": false,
      "oas3-schema": true
    }
  };

  const spectral = new Spectral();

  beforeAll(() => {
    spectral.setRuleset(ruleset);
  });

  /**
   * Spectral 6 lints a parsed document rather than a plain object, so the
   * generated document is handed over as the JSON a consumer would receive.
   */
  const lint = (document: unknown): Promise<ISpectralDiagnostic[]> =>
    spectral.run(new Document(JSON.stringify(document), Json));

  test("the extends and rules wiring leaves the named rules enabled", async () => {
    // Every assertion above is `toHaveLength(0)`, which a ruleset that enabled
    // nothing satisfies just as well as a clean document. A rule that no longer
    // exists is not the gap: `setRuleset` throws on an unknown name, so a
    // rename fails loudly on its own. The gap is a ruleset that stays
    // well-formed while enabling nothing — every rule flipped to `false`, or
    // the `extends`/`rules` wiring changed — which would leave all of those
    // assertions passing over nothing. So this document breaks specific rules
    // and names the codes it expects back.
    const findings = await lint({
      openapi: "3.0.2",
      info: { title: "t", version: "1" },
      servers: [{ url: "https://example.org/" }],
      tags: [{ name: "zebra" }, { name: "apple" }],
      paths: {
        "/trailing/": { get: { responses: { "200": { description: "ok" } } } }
      }
    });

    expect(findings.map(finding => finding.code).sort()).toEqual([
      "oas3-server-trailing-slash",
      "openapi-tags-alphabetical",
      "path-keys-no-trailing-slash"
    ]);
  });

  test("minimal contract produces minimal OpenAPI 3", async () => {
    const contract = generateContract("minimal-contract.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("versioned contract produces a versioned OpenAPI 3", async () => {
    const contract = generateContract("versioned-contract.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with one server OpenAPI 3", async () => {
    const contract = generateContract("contract-with-one-server.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with multiple servers OpenAPI 3", async () => {
    const contract = generateContract("contract-with-multiple-servers.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  describe("security", () => {
    test("contract with security header", async () => {
      const contract = generateContract("contract-with-security-header.ts");
      const result = generateOpenAPI3(contract);

      expect(result.security).toHaveLength(1);
      expect(result.security).toContainEqual({ SecurityHeader: [] });
      expect(result.components).toHaveProperty("securitySchemes", {
        SecurityHeader: {
          type: "apiKey",
          in: "header",
          name: "security-header"
        }
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("HTTP verbs", () => {
    test("GET endpoint", async () => {
      const contract = generateContract("contract-with-get-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        get: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("POST endpoint", async () => {
      const contract = generateContract("contract-with-post-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        post: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PUT endpoint", async () => {
      const contract = generateContract("contract-with-put-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        put: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PATCH endpoint", async () => {
      const contract = generateContract("contract-with-patch-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        patch: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("DELETE endpoint", async () => {
      const contract = generateContract("contract-with-delete-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        delete: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("HEAD endpoint", async () => {
      const contract = generateContract("contract-with-head-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        head: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("path params", () => {
    test("endpoint with path params", async () => {
      const contract = generateContract("contract-with-path-params.ts");
      const result = generateOpenAPI3(contract);

      expect(
        result.paths["/companies/{companyId}/users/{userId}"].get
      ).toHaveProperty("parameters", [
        {
          name: "companyId",
          in: "path",
          required: true,
          schema: expect.anything()
        },
        {
          name: "userId",
          in: "path",
          required: true,
          schema: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("query params", () => {
    test("endpoint with query params", async () => {
      const contract = generateContract("contract-with-query-params.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "country",
          in: "query",
          required: true,
          schema: expect.anything()
        },
        {
          name: "post.code",
          in: "query",
          required: false,
          schema: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with array query param", async () => {
      const contract = generateContract("contract-with-array-query-param.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "countries",
          in: "query",
          style: "form",
          explode: true,
          required: true,
          schema: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with array query param and comma serialization strategy", async () => {
      const contract = generateContract(
        "contract-with-array-query-param-and-comma-serialization-strategy.ts"
      );
      const result = generateOpenAPI3(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "countries",
          in: "query",
          style: "form",
          explode: false,
          required: true,
          schema: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with object query param", async () => {
      const contract = generateContract("contract-with-object-query-param.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "pagination",
          in: "query",
          style: "deepObject",
          explode: true,
          required: true,
          schema: {
            type: "object",
            properties: {
              page: {
                type: "integer",
                format: "int32"
              },
              order: {
                type: "string",
                enum: ["desc", "asc"]
              }
            },
            required: ["page", "order"]
          }
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });
  describe("headers", () => {
    test("endpoint with request headers", async () => {
      const contract = generateContract("contract-with-request-headers.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"].get).toHaveProperty("parameters", [
        {
          name: "Accept-Encoding",
          in: "header",
          required: false,
          schema: expect.anything()
        },
        {
          name: "Accept-Language",
          in: "header",
          required: true,
          schema: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with response headers", async () => {
      const contract = generateContract("contract-with-response-headers.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"].post).toHaveProperty(
        "responses.201.headers",
        {
          Link: {
            required: false,
            schema: expect.anything()
          },
          Location: {
            required: true,
            schema: expect.anything()
          }
        }
      );
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("responses", () => {
    test("endpoint specific and default responses", async () => {
      const contract = generateContract(
        "contract-with-specific-and-default-responses.ts"
      );
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"].get).toHaveProperty("responses", {
        "200": {
          description: expect.anything(),
          content: {
            "application/json": expect.anything()
          }
        },
        "404": {
          description: expect.anything(),
          content: {
            "application/json": expect.anything()
          }
        },
        default: {
          description: expect.anything(),
          content: {
            "application/json": expect.anything()
          }
        }
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("examples", () => {
    test("contract with examples parses correctly to an openapi specification", async () => {
      const contract = generateContract("contract-with-examples.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"].get).toHaveProperty("parameters", [
        {
          description: "property-example description",
          examples: {
            "property-example": {
              value: "property-example-value"
            }
          },
          name: "Accept-Language",
          in: "header",
          required: true,
          schema: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("schemaprops", () => {
    test("contract with schemaprops parses correctly to an openapi specification", async () => {
      const contract = generateContract("contract-with-schemaprops.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"].get).toHaveProperty("parameters", [
        {
          description: "property-schemaprop description for string",
          name: "status",
          in: "header",
          required: true,
          schema: {
            title: "status-title",
            type: "string",
            minLength: 12,
            maxLength: 20,
            pattern: "^[0-9a-z_]+$"
          }
        },
        {
          description: "property-schemaprop description for date-time",
          in: "header",
          name: "start-time",
          required: false,
          schema: {
            title: "date-time-title",
            type: "string",
            format: "date-time",
            default: "1990-12-31T15:59:60-08:00"
          }
        },
        {
          description: "property-schemaprop description for integer",
          name: "size",
          in: "header",
          required: true,
          schema: {
            format: "int32",
            type: "integer",
            minimum: 1,
            exclusiveMaximum: true,
            deprecated: true,
            default: 42
          }
        }
      ]);
      expect(result.paths["/users"].get).toHaveProperty("responses", {
        "200": {
          description: expect.anything(),
          content: {
            "application/json": {
              schema: {
                items: {
                  properties: {
                    element: {
                      description: "property-schemaprop description for object",
                      maxProperties: 100,
                      minProperties: 1,
                      additionalProperties: true,
                      example: { price: 3.14 },
                      properties: {
                        price: {
                          description:
                            "property-schemaprop description for float inner object",
                          format: "float",
                          type: "number",
                          example: 12,
                          maximum: 99.95,
                          multipleOf: 4,
                          exclusiveMinimum: false
                        }
                      },
                      required: ["price"],
                      type: "object"
                    },
                    id: {
                      type: "string"
                    },
                    name: {
                      type: "string"
                    },
                    currencies: {
                      description: "property-schemaprop description for array",
                      items: {
                        type: "string"
                      },
                      maxItems: 5,
                      minItems: 1,
                      type: "array",
                      uniqueItems: true
                    },
                    code: {
                      description: "property-schemaprop description for union",
                      enum: ["VALID", "NOT_VALID", "WAITING", "APPROVED"],
                      title: "process-code",
                      example: "WAITING",
                      deprecated: false,
                      type: "string"
                    },
                    inheritance: {
                      allOf: [
                        {
                          properties: {
                            inheritId: {
                              description:
                                "property-schemaprop description for double inner intersection",
                              type: "number",
                              format: "double",
                              example: 12,
                              exclusiveMinimum: false,
                              maximum: 99.95,
                              multipleOf: 4
                            }
                          },
                          required: ["inheritId"],
                          type: "object"
                        },
                        {
                          properties: {
                            inheritName: {
                              description:
                                "property-schemaprop description for long inner intersection",
                              type: "integer",
                              format: "int64",
                              default: 42,
                              deprecated: true,
                              exclusiveMaximum: true,
                              minimum: 1
                            }
                          },
                          required: ["inheritName"],
                          type: "object"
                        }
                      ],
                      deprecated: true,
                      example: {
                        inheritId: 3.14,
                        inheritName: 42
                      },
                      description:
                        "property-schemaprop description for intersection",
                      title: "process-code"
                    }
                  },
                  required: ["id", "name", "element"],
                  type: "object"
                },
                type: "array"
              }
            }
          }
        }
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("intersection types", () => {
    test("evaluates intersection type", async () => {
      const contract = generateContract("contract-with-intersection-types.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        get: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("endpoint metadata", () => {
    test("contract with endpoint metadata description and summary", async () => {
      const contract = generateContract("contract-with-endpoint-metadata.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        get: {
          description: "My description",
          summary: "My summary"
        }
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });
});

/**
 * Helper function to create contract from a file. Usable
 * only from this directory.
 *
 * @param filename name of the file
 */
function generateContract(filename: string): Contract {
  const file = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/${filename}`
  ).file;

  const { contract } = parseContract(file).unwrapOrThrow();
  return contract;
}
