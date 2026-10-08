import { OAS_3_1_SCHEMA } from "./oas-3-1-schema";
import {
  OpenApi31ComplianceError,
  validateOpenAPI31,
  withStaticDialectRefs
} from "./validate";

const LEAF_SCHEMAS = {
  Cat: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["cat"] },
      meows: { type: "boolean" }
    },
    required: ["kind", "meows"]
  },
  Dog: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["dog"] },
      barks: { type: "boolean" }
    },
    required: ["kind", "barks"]
  },
  Bird: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["bird"] }
    },
    required: ["kind"]
  }
};

const PET = {
  oneOf: [
    { $ref: "#/components/schemas/Cat" },
    { $ref: "#/components/schemas/Dog" }
  ],
  discriminator: {
    propertyName: "kind",
    mapping: {
      cat: "#/components/schemas/Cat",
      dog: "#/components/schemas/Dog"
    }
  }
};

function documentWith(
  schemas: Record<string, unknown>,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: { title: "contract", version: "1.0.0" },
    paths: {},
    components: { schemas: { ...LEAF_SCHEMAS, ...schemas } },
    ...overrides
  };
}

describe("withStaticDialectRefs", () => {
  test("replaces every $dynamicRef in the document schema", () => {
    const { schema, replacements } = withStaticDialectRefs(OAS_3_1_SCHEMA);

    expect(replacements).toBe(4);
    expect(JSON.stringify(schema)).not.toContain("$dynamicRef");
  });

  test("leaves the vendored schema unmodified", () => {
    const before = JSON.stringify(OAS_3_1_SCHEMA);
    withStaticDialectRefs(OAS_3_1_SCHEMA);

    expect(JSON.stringify(OAS_3_1_SCHEMA)).toBe(before);
  });
});

describe("validateOpenAPI31", () => {
  test("accepts a conforming document", () => {
    const result = validateOpenAPI31(
      documentWith({
        Pet: PET,
        MaybePet: { anyOf: [PET, { type: "null" }] },
        Name: { type: ["string", "null"], description: "a name" },
        PetRef: { $ref: "#/components/schemas/Pet", description: "a pet" },
        Tagged: {
          type: "object",
          properties: { tag: { type: "string", examples: ["x"] } }
        }
      })
    );

    expect(result).toEqual({ errors: [], warnings: [] });
  });

  describe("structural violations", () => {
    test("a boolean exclusiveMinimum", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Age: { type: "integer", minimum: 0, exclusiveMinimum: true }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Age/exclusiveMinimum",
          message: "must be number"
        }
      ]);
    });

    test("an invalid type", () => {
      expect(
        validateOpenAPI31(documentWith({ Age: { type: "int" } })).errors
      ).toEqual([
        {
          path: "/components/schemas/Age/type",
          message:
            'must be equal to one of the allowed values: ["array","boolean","integer","null","number","object","string"]'
        },
        { path: "/components/schemas/Age/type", message: "must be array" },
        {
          path: "/components/schemas/Age/type",
          message: "must match a schema in anyOf"
        }
      ]);
    });

    test("an invalid type in a nested schema", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Person: {
              type: "object",
              properties: { age: { type: "int" } }
            }
          })
        ).errors
      ).toContainEqual({
        path: "/components/schemas/Person/properties/age/type",
        message: "must be array"
      });
    });

    test("an unknown discriminator keyword", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              ...PET,
              discriminator: { ...PET.discriminator, default: "cat" }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/discriminator",
          message: 'must NOT have unevaluated properties: "default"'
        }
      ]);
    });

    test("empty responses", () => {
      expect(
        validateOpenAPI31(
          documentWith({}, { paths: { "/pets": { get: { responses: {} } } } })
        ).errors
      ).toEqual([
        {
          path: "/paths/~1pets/get/responses",
          message: "must have required property 'default'"
        },
        {
          path: "/paths/~1pets/get/responses",
          message: 'must match "then" schema'
        },
        {
          path: "/paths/~1pets/get/responses",
          message: "must NOT have fewer than 1 properties"
        }
      ]);
    });

    test("accepts a templated server URL", () => {
      expect(
        validateOpenAPI31(
          documentWith(
            {},
            {
              servers: [
                {
                  url: "https://{username}.example.com",
                  variables: { username: { default: "demo" } }
                }
              ]
            }
          )
        ).errors
      ).toEqual([]);
    });
  });

  describe("semantic violations", () => {
    test("nullable beside $ref", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Owner: {
              type: "object",
              properties: {
                pet: { $ref: "#/components/schemas/Cat", nullable: true }
              }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Owner/properties/pet/nullable",
          message:
            'the "nullable" keyword does not exist in OpenAPI 3.1; add "null" to "type" or an { "type": "null" } member instead'
        }
      ]);
    });

    test("nullable beside a discriminated oneOf", () => {
      expect(
        validateOpenAPI31(documentWith({ Pet: { ...PET, nullable: true } }))
          .errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/nullable",
          message:
            'the "nullable" keyword does not exist in OpenAPI 3.1; add "null" to "type" or an { "type": "null" } member instead'
        }
      ]);
    });

    test("nullable beside allOf", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Hybrid: {
              allOf: [
                { $ref: "#/components/schemas/Cat" },
                { type: "object", properties: { wings: { type: "integer" } } }
              ],
              nullable: true
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Hybrid/nullable",
          message:
            'the "nullable" keyword does not exist in OpenAPI 3.1; add "null" to "type" or an { "type": "null" } member instead'
        }
      ]);
    });

    test("a schema-level example", () => {
      expect(
        validateOpenAPI31(
          documentWith({ Name: { type: "string", example: "Rex" } })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Name/example",
          message:
            'the "example" keyword is deprecated in OpenAPI 3.1 Schema Objects; use "examples"'
        }
      ]);
    });

    test("a discriminator mapping that targets a union wrapper", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: PET,
            Animal: {
              oneOf: [
                { $ref: "#/components/schemas/Pet" },
                { $ref: "#/components/schemas/Bird" }
              ],
              discriminator: {
                propertyName: "kind",
                mapping: {
                  cat: "#/components/schemas/Pet",
                  dog: "#/components/schemas/Pet",
                  bird: "#/components/schemas/Bird"
                }
              }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Animal/discriminator/mapping/cat",
          message:
            'the mapping target #/components/schemas/Pet does not have "kind" as a required property'
        },
        {
          path: "/components/schemas/Animal/discriminator/mapping/dog",
          message:
            'the mapping target #/components/schemas/Pet does not have "kind" as a required property'
        }
      ]);
    });

    test("an unresolved $ref", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Owner: {
              type: "array",
              items: { $ref: "#/components/schemas/Hamster" }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Owner/items/$ref",
          message: '"#/components/schemas/Hamster" does not resolve to a schema'
        }
      ]);
    });

    test("a $ref outside components.schemas", () => {
      expect(
        validateOpenAPI31(
          documentWith({ Owner: { $ref: "#/definitions/Cat" } })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Owner/$ref",
          message:
            '"#/definitions/Cat" does not start with "#/components/schemas/"'
        }
      ]);
    });

    test("null inside a discriminated oneOf", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              oneOf: [{ $ref: "#/components/schemas/Cat" }, { type: "null" }],
              discriminator: { propertyName: "kind" }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/oneOf/1",
          message:
            "a member of a discriminated oneOf admits null; the null branch belongs outside the discriminated oneOf"
        },
        {
          path: "/components/schemas/Pet/oneOf/1",
          message:
            'the discriminator property "kind" is not a required property of this member'
        }
      ]);
    });

    test("a nullable reference inside a discriminated oneOf", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            MaybeDog: {
              anyOf: [{ $ref: "#/components/schemas/Dog" }, { type: "null" }]
            },
            Pet: {
              oneOf: [
                { $ref: "#/components/schemas/Cat" },
                { $ref: "#/components/schemas/MaybeDog" }
              ],
              discriminator: { propertyName: "kind" }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/oneOf/1",
          message:
            "a member of a discriminated oneOf admits null; the null branch belongs outside the discriminated oneOf"
        },
        {
          path: "/components/schemas/Pet/oneOf/1",
          message:
            'the discriminator property "kind" is not a required property of this member'
        }
      ]);
    });

    test("a discriminator without oneOf", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              anyOf: PET.oneOf,
              discriminator: PET.discriminator
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/discriminator",
          message: 'a discriminator must sit beside "oneOf"'
        }
      ]);
    });

    test("a mapping that differs from the oneOf members", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              oneOf: [
                { $ref: "#/components/schemas/Cat" },
                { $ref: "#/components/schemas/Dog" }
              ],
              discriminator: {
                propertyName: "kind",
                mapping: {
                  cat: "#/components/schemas/Cat",
                  bird: "#/components/schemas/Bird"
                }
              }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/discriminator/mapping",
          message:
            "the mapping values must equal the oneOf $refs; oneOf members missing from the mapping: #/components/schemas/Dog; mapping values that are not oneOf members: #/components/schemas/Bird"
        }
      ]);
    });

    test("an inline member beside a mapping", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              oneOf: [{ $ref: "#/components/schemas/Cat" }, LEAF_SCHEMAS.Dog],
              discriminator: {
                propertyName: "kind",
                mapping: { cat: "#/components/schemas/Cat" }
              }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/oneOf/1",
          message:
            "every member of a oneOf with a discriminator mapping must be a $ref"
        }
      ]);
    });

    test("a mapping key that the target's enum does not contain", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Pet: {
              ...PET,
              discriminator: {
                propertyName: "kind",
                mapping: {
                  kitten: "#/components/schemas/Cat",
                  dog: "#/components/schemas/Dog"
                }
              }
            }
          })
        ).errors
      ).toEqual([
        {
          path: "/components/schemas/Pet/discriminator/mapping/kitten",
          message:
            'the "kind" property of the mapping target #/components/schemas/Cat does not restrict its value to "kitten" with "enum"'
        }
      ]);
    });

    test("a mapping target whose discriminator property comes through allOf and $ref", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Kind: { type: "string", enum: ["robot"] },
            Base: {
              type: "object",
              properties: { kind: { $ref: "#/components/schemas/Kind" } },
              required: ["kind"]
            },
            Robot: {
              allOf: [
                { $ref: "#/components/schemas/Base" },
                { type: "object", properties: { beeps: { type: "boolean" } } }
              ]
            },
            RobotAlias: { $ref: "#/components/schemas/Robot" },
            Pet: {
              oneOf: [
                { $ref: "#/components/schemas/Cat" },
                { $ref: "#/components/schemas/RobotAlias" }
              ],
              discriminator: {
                propertyName: "kind",
                mapping: {
                  cat: "#/components/schemas/Cat",
                  robot: "#/components/schemas/RobotAlias"
                }
              }
            }
          })
        ).errors
      ).toEqual([]);
    });

    test("a server variable default outside its enum", () => {
      expect(
        validateOpenAPI31(
          documentWith(
            {},
            {
              servers: [
                {
                  url: "https://example.com:{port}",
                  variables: { port: { enum: ["80", "443"], default: "8080" } }
                }
              ]
            }
          )
        ).errors
      ).toEqual([
        {
          path: "/servers/0/variables/port/default",
          message:
            'default "8080" is not one of the variable\'s enum values ["80","443"]'
        }
      ]);
    });

    test("checks the schemas of parameters, request bodies, responses and headers", () => {
      const nullableString = { type: "string", nullable: true };
      expect(
        validateOpenAPI31(
          documentWith(
            {},
            {
              paths: {
                "/pets/{id}": {
                  post: {
                    parameters: [
                      {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: nullableString
                      }
                    ],
                    requestBody: {
                      content: {
                        "application/json": { schema: nullableString }
                      }
                    },
                    responses: {
                      "200": {
                        description: "ok",
                        headers: { Location: { schema: nullableString } },
                        content: {
                          "application/json": { schema: nullableString }
                        }
                      }
                    }
                  }
                }
              }
            }
          )
        ).errors.map(violation => violation.path)
      ).toEqual([
        "/paths/~1pets~1{id}/post/parameters/0/schema/nullable",
        "/paths/~1pets~1{id}/post/requestBody/content/application~1json/schema/nullable",
        "/paths/~1pets~1{id}/post/responses/200/content/application~1json/schema/nullable",
        "/paths/~1pets~1{id}/post/responses/200/headers/Location/schema/nullable"
      ]);
    });
  });

  describe("keywords are only read in schema positions", () => {
    test("a property named nullable or example", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Settings: {
              type: "object",
              properties: {
                nullable: { type: "boolean" },
                example: { type: "string" },
                $ref: { type: "string" },
                discriminator: { type: "string" }
              },
              required: ["nullable"]
            }
          })
        )
      ).toEqual({ errors: [], warnings: [] });
    });

    test("keyword-shaped data in examples, default and enum", () => {
      const data = { nullable: true, example: 1, $ref: "#/nowhere" };
      expect(
        validateOpenAPI31(
          documentWith(
            {
              Settings: {
                type: "object",
                default: data,
                examples: [data],
                enum: [data]
              }
            },
            {
              paths: {
                "/settings": {
                  get: {
                    parameters: [
                      {
                        name: "filter",
                        in: "query",
                        schema: { type: "object" },
                        examples: { one: { value: data } }
                      }
                    ],
                    responses: { default: { description: "ok" } }
                  }
                }
              }
            }
          )
        )
      ).toEqual({ errors: [], warnings: [] });
    });
  });

  describe("warnings", () => {
    test("overlapping integer and number members", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Int32: { type: "integer", format: "int32" },
            Amount: {
              oneOf: [
                { $ref: "#/components/schemas/Int32" },
                { type: "number", format: "float" }
              ]
            }
          })
        )
      ).toEqual({
        errors: [],
        warnings: [
          {
            path: "/components/schemas/Amount/oneOf",
            message:
              "members 0 and 1 can match the same value, so that value matches more than one oneOf branch"
          }
        ]
      });
    });

    test("an enum value that another member also accepts", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Status: {
              oneOf: [
                { type: "string", enum: ["on", "off"] },
                { type: "string" }
              ]
            }
          })
        ).warnings
      ).toHaveLength(1);
    });

    test("disjoint scalar members", () => {
      expect(
        validateOpenAPI31(
          documentWith({
            Status: {
              oneOf: [
                { type: "string", enum: ["on", "off"] },
                { type: "string", enum: ["unknown"] },
                { type: "boolean" },
                { type: "integer" }
              ]
            }
          })
        ).warnings
      ).toEqual([]);
    });
  });
});

describe("OpenApi31ComplianceError", () => {
  test("lists every violation", () => {
    const error = new OpenApi31ComplianceError([
      { path: "/components/schemas/A/nullable", message: "first" },
      { path: "", message: "second" }
    ]);

    expect(error.message).toBe(
      [
        "The generated document does not conform to OpenAPI 3.1 (2 violations):",
        "  /components/schemas/A/nullable: first",
        "  /: second"
      ].join("\n")
    );
    expect(error.violations).toHaveLength(2);
  });
});
