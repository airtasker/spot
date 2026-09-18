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
import { generateOpenAPI2 } from "./openapi2";

describe("OpenAPI 2 generator", () => {
  /**
   * The OpenAPI rules every generated document is held to. See the equivalent
   * block in `openapi3.spec.ts` for why `oas` is pulled in with everything off
   * and how each rule's own `formats` decides where it applies.
   */
  const ruleset: RulesetDefinition = {
    extends: [[oas as RulesetDefinition, "off"]],
    rules: {
      // `operation-2xx-response` under spectral 5.
      "operation-success-response": true,
      "operation-operationId-unique": true,
      "operation-parameters": true,
      "path-params": true,
      "no-eval-in-markdown": true,
      "no-script-tags-in-markdown": true,
      "openapi-tags-alphabetical": true,
      "operation-operationId-valid-in-url": true,
      "path-declarations-must-exist": true,
      "path-keys-no-trailing-slash": true,
      "path-not-include-query": true,
      "typed-enum": true,
      "oas2-operation-formData-consume-check": true,
      "oas2-operation-security-defined": true,
      // As in `openapi3.spec.ts`: the old ruleset named `oas2-valid-example`,
      // which spectral 5 did not have, so neither of these ran. The schema half
      // waits on https://airtasker.atlassian.net/browse/COMPASS-29
      "oas2-valid-media-example": true,
      "oas2-valid-schema-example": false,
      "oas2-anyOf": true,
      "oas2-oneOf": true,
      "oas2-schema": true
      // `example-value-or-externalValue` is gone rather than renamed. Spectral 6
      // has only an `oas3-` form, which an OpenAPI 2 document would skip — and
      // spectral 5 had no rule by that name either, so nothing is lost.
    }
  };

  const spectral = new Spectral();

  beforeAll(() => {
    spectral.setRuleset(ruleset);
  });

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
      swagger: "2.0",
      info: { title: "t", version: "1" },
      host: "example.org",
      tags: [{ name: "zebra" }, { name: "apple" }],
      paths: {
        "/trailing/": { get: { responses: { "200": { description: "ok" } } } }
      }
    });

    expect(findings.map(finding => finding.code).sort()).toEqual([
      "openapi-tags-alphabetical",
      "path-keys-no-trailing-slash"
    ]);
  });

  test("minimal contract produces minimal OpenAPI 2", async () => {
    const contract = generateContract("minimal-contract.ts");
    const result = generateOpenAPI2(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with version produces a versioned OpenAPI 2", async () => {
    const contract = generateContract("versioned-contract.ts");
    const result = generateOpenAPI2(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await lint(result);
    expect(spectralResult).toHaveLength(0);
  });

  describe("security", () => {
    test("contract with security header", async () => {
      const contract = generateContract("contract-with-security-header.ts");
      const result = generateOpenAPI2(contract);

      expect(result.consumes).toEqual(["application/json"]);
      expect(result.produces).toEqual(["application/json"]);
      expect(result.security).toHaveLength(1);
      expect(result.security).toContainEqual({ SecurityHeader: [] });
      expect(result.securityDefinitions).toHaveProperty("SecurityHeader", {
        type: "apiKey",
        in: "header",
        name: "security-header"
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("HTTP verbs", () => {
    test("GET endpoint", async () => {
      const contract = generateContract("contract-with-get-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"]).toMatchObject({
        get: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("POST endpoint", async () => {
      const contract = generateContract("contract-with-post-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"]).toMatchObject({
        post: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PUT endpoint", async () => {
      const contract = generateContract("contract-with-put-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        put: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PATCH endpoint", async () => {
      const contract = generateContract("contract-with-patch-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        patch: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("DELETE endpoint", async () => {
      const contract = generateContract("contract-with-delete-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        delete: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("path params", () => {
    test("endpoint with path params", async () => {
      const contract = generateContract("contract-with-path-params.ts");
      const result = generateOpenAPI2(contract);

      expect(
        result.paths["/companies/{companyId}/users/{userId}"].get
      ).toHaveProperty("parameters", [
        {
          name: "companyId",
          in: "path",
          required: true,
          type: expect.anything()
        },
        {
          name: "userId",
          in: "path",
          required: true,
          type: expect.anything()
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
      const result = generateOpenAPI2(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "country",
          in: "query",
          required: true,
          type: expect.anything()
        },
        {
          name: "post.code",
          in: "query",
          required: false,
          type: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with array query param", async () => {
      const contract = generateContract("contract-with-array-query-param.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "countries",
          in: "query",
          required: true,
          type: "array",
          items: {
            type: "string"
          },
          collectionFormat: "multi"
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
      const result = generateOpenAPI2(contract);

      expect(result.paths["/companies"].get).toHaveProperty("parameters", [
        {
          name: "countries",
          in: "query",
          required: true,
          type: "array",
          items: {
            type: "string"
          },
          collectionFormat: "csv"
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with object query param", async () => {
      const contract = generateContract("contract-with-object-query-param.ts");
      expect(() => generateOpenAPI2(contract)).toThrow("");
    });
  });

  describe("headers", () => {
    test("endpoint with request headers", async () => {
      const contract = generateContract("contract-with-request-headers.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"].get).toHaveProperty("parameters", [
        {
          name: "Accept-Encoding",
          in: "header",
          required: false,
          type: expect.anything()
        },
        {
          name: "Accept-Language",
          in: "header",
          required: true,
          type: expect.anything()
        }
      ]);
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("endpoint with response headers", async () => {
      const contract = generateContract("contract-with-response-headers.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"].post).toHaveProperty(
        "responses.201.headers",
        {
          Link: {
            type: expect.anything()
          },
          Location: {
            type: expect.anything()
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
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"].get).toHaveProperty("responses", {
        "200": {
          description: expect.anything(),
          schema: expect.anything()
        },
        "404": {
          description: expect.anything(),
          schema: expect.anything()
        },
        default: {
          description: expect.anything(),
          schema: expect.anything()
        }
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("schemaprops", () => {
    test("contract with schemaprops parses correctly to an openapi specification", async () => {
      const contract = generateContract("contract-with-schemaprops.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"].get).toHaveProperty("parameters", [
        {
          description: "property-schemaprop description for string",
          name: "status",
          in: "header",
          required: true,
          type: "string",
          minLength: 12,
          maxLength: 20,
          pattern: "^[0-9a-z_]+$"
        },
        {
          description: "property-schemaprop description for date-time",
          name: "start-time",
          in: "header",
          required: false,
          type: "string",
          format: "date-time",
          default: "1990-12-31T15:59:60-08:00"
        },
        {
          description: "property-schemaprop description for integer",
          name: "size",
          in: "header",
          required: true,
          format: "int32",
          type: "integer",
          minimum: 1,
          default: 42
        }
      ]);
      expect(result.paths["/users"].get).toHaveProperty("responses", {
        "200": {
          description: expect.anything(),
          schema: {
            items: {
              properties: {
                element: {
                  description: "property-schemaprop description for object",
                  maxProperties: 100,
                  minProperties: 1,
                  example: { price: 3.14 },
                  properties: {
                    price: {
                      description:
                        "property-schemaprop description for float inner object",
                      format: "float",
                      type: "number",
                      example: 12,
                      maximum: 99.95,
                      multipleOf: 4
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
                          minimum: 1
                        }
                      },
                      required: ["inheritName"],
                      type: "object"
                    }
                  ],
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
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await lint(result);
      expect(spectralResult).toHaveLength(0);
    });
  });

  describe("intersection types", () => {
    test("evaluates intersection type", async () => {
      const contract = generateContract("contract-with-intersection-types.ts");
      const result = generateOpenAPI2(contract);

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
      const result = generateOpenAPI2(contract);

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
