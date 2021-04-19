import { isOpenApiv3, Spectral } from "@stoplight/spectral";
import { Contract } from "../../definitions";
import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { generateOpenAPI3 } from "./openapi3";

describe("OpenAPI 3 generator", () => {
  const spectral = new Spectral();

  beforeAll(async () => {
    spectral.registerFormat("oas3", isOpenApiv3);
    await spectral.loadRuleset(`${__dirname}/spectral.ruleset.yml`);
  });

  test("minimal contract produces minimal OpenAPI 3", async () => {
    const contract = generateContract("minimal-contract.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("versioned contract produces a versioned OpenAPI 3", async () => {
    const contract = generateContract("versioned-contract.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with one server OpenAPI 3", async () => {
    const contract = generateContract("contract-with-one-server.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("contract with multiple servers OpenAPI 3", async () => {
    const contract = generateContract("contract-with-multiple-servers.ts");
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("POST endpoint", async () => {
      const contract = generateContract("contract-with-post-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users"]).toMatchObject({
        post: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PUT endpoint", async () => {
      const contract = generateContract("contract-with-put-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        put: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("PATCH endpoint", async () => {
      const contract = generateContract("contract-with-patch-endpoint.ts");
      const result = generateOpenAPI3(contract);

      expect(result.paths["/users/{id}"]).toMatchObject({
        patch: expect.anything()
      });
      expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
      const spectralResult = await spectral.run(result);
      expect(spectralResult).toHaveLength(0);
    });

    test("DELETE endpoint", async () => {
      const contract = generateContract("contract-with-delete-endpoint.ts");
      const result = generateOpenAPI3(contract);

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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
      const spectralResult = await spectral.run(result);
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
