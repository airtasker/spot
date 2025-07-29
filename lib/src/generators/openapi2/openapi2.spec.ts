import { isOpenApiv2, Spectral } from "@stoplight/spectral";
import { Contract } from "../../definitions";
import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { generateOpenAPI2 } from "./openapi2";

describe("OpenAPI 2 generator", () => {
  const spectral = new Spectral();

  beforeAll(async () => {
    spectral.registerFormat("oas2", isOpenApiv2);
    await spectral.loadRuleset(`${__dirname}/spectral.ruleset.yml`);
  });

  test("minimal contract produces minimal OpenAPI 2", async () => {
    const contract = generateContract("minimal-contract.ts");
    const result = generateOpenAPI2(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with version produces a versioned OpenAPI 2", async () => {
    const contract = generateContract("versioned-contract.ts");
    const result = generateOpenAPI2(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("POST endpoint", async () => {
      const contract = generateContract("contract-with-post-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users"]).toMatchObject({
        post: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PUT endpoint", async () => {
      const contract = generateContract("contract-with-put-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        put: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PATCH endpoint", async () => {
      const contract = generateContract("contract-with-patch-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        patch: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("DELETE endpoint", async () => {
      const contract = generateContract("contract-with-delete-endpoint.ts");
      const result = generateOpenAPI2(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        delete: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
