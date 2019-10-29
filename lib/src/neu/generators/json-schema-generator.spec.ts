import { parse } from "../parser";
import {
  arrayType,
  booleanLiteralType,
  booleanType,
  floatLiteralType,
  floatType,
  int32Type,
  int64Type,
  intLiteralType,
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  unionType
} from "../types";
import {
  generateJsonSchema,
  generateJsonSchemaType
} from "./json-schema-generator";

const EXAMPLE_PATH = "./lib/src/__examples__/contract.ts";

describe("JSON Schema generator", () => {
  test("produces valid code", async () => {
    const contract = parse(EXAMPLE_PATH);
    expect(generateJsonSchema(contract, "json")).toMatchSnapshot("json");
    expect(generateJsonSchema(contract, "yaml")).toMatchSnapshot("yaml");
  });

  describe("generates type validator", () => {
    test("null", () => {
      expect(generateJsonSchemaType(nullType())).toMatchInlineSnapshot(`
        Object {
          "type": "null",
        }
      `);
    });

    test("boolean", () => {
      expect(generateJsonSchemaType(booleanType())).toMatchInlineSnapshot(`
        Object {
          "type": "boolean",
        }
      `);
    });

    test("boolean literal", () => {
      expect(generateJsonSchemaType(booleanLiteralType(true)))
        .toMatchInlineSnapshot(`
        Object {
          "const": true,
          "type": "boolean",
        }
      `);
      expect(generateJsonSchemaType(booleanLiteralType(false)))
        .toMatchInlineSnapshot(`
        Object {
          "const": false,
          "type": "boolean",
        }
      `);
    });

    test("string", () => {
      expect(generateJsonSchemaType(stringType())).toMatchInlineSnapshot(`
        Object {
          "type": "string",
        }
      `);
    });

    test("string literal", () => {
      expect(generateJsonSchemaType(stringLiteralType("some literal")))
        .toMatchInlineSnapshot(`
        Object {
          "const": "some literal",
          "type": "string",
        }
      `);
    });

    test("float", () => {
      expect(generateJsonSchemaType(floatType())).toMatchInlineSnapshot(`
        Object {
          "type": "number",
        }
      `);
    });

    test("number literal", () => {
      expect(generateJsonSchemaType(floatLiteralType(1.5)))
        .toMatchInlineSnapshot(`
        Object {
          "const": 1.5,
          "type": "number",
        }
      `);
      expect(generateJsonSchemaType(floatLiteralType(-23.1)))
        .toMatchInlineSnapshot(`
        Object {
          "const": -23.1,
          "type": "number",
        }
      `);
    });

    test("int32", () => {
      expect(generateJsonSchemaType(int32Type())).toMatchInlineSnapshot(`
        Object {
          "type": "integer",
        }
      `);
    });

    test("int64", () => {
      expect(generateJsonSchemaType(int64Type())).toMatchInlineSnapshot(`
        Object {
          "type": "integer",
        }
      `);
    });

    test("number literal", () => {
      expect(generateJsonSchemaType(intLiteralType(0))).toMatchInlineSnapshot(`
        Object {
          "const": 0,
          "type": "integer",
        }
      `);
      expect(generateJsonSchemaType(intLiteralType(123)))
        .toMatchInlineSnapshot(`
        Object {
          "const": 123,
          "type": "integer",
        }
      `);
      expect(generateJsonSchemaType(intLiteralType(-1000)))
        .toMatchInlineSnapshot(`
        Object {
          "const": -1000,
          "type": "integer",
        }
      `);
    });

    test("object", () => {
      expect(generateJsonSchemaType(objectType([]))).toMatchInlineSnapshot(`
        Object {
          "additionalProperties": true,
          "properties": Object {},
          "required": Array [],
          "type": "object",
        }
      `);
      expect(
        generateJsonSchemaType(
          objectType([
            {
              name: "singleField",
              type: floatType(),
              optional: false
            }
          ])
        )
      ).toMatchInlineSnapshot(`
        Object {
          "additionalProperties": true,
          "properties": Object {
            "singleField": Object {
              "type": "number",
            },
          },
          "required": Array [
            "singleField",
          ],
          "type": "object",
        }
      `);
      expect(
        generateJsonSchemaType(
          objectType([
            {
              name: "field1",
              type: floatType(),
              optional: false
            },
            {
              name: "field2",
              type: stringType(),
              optional: false
            },
            {
              name: "field3",
              type: booleanType(),
              optional: true
            }
          ])
        )
      ).toMatchInlineSnapshot(`
        Object {
          "additionalProperties": true,
          "properties": Object {
            "field1": Object {
              "type": "number",
            },
            "field2": Object {
              "type": "string",
            },
            "field3": Object {
              "type": "boolean",
            },
          },
          "required": Array [
            "field1",
            "field2",
          ],
          "type": "object",
        }
      `);
    });

    test("array", () => {
      expect(generateJsonSchemaType(arrayType(stringType())))
        .toMatchInlineSnapshot(`
        Object {
          "items": Object {
            "type": "string",
          },
          "type": "array",
        }
      `);
    });

    test("union", () => {
      expect(
        generateJsonSchemaType(
          unionType([stringType(), floatType(), booleanType()])
        )
      ).toMatchInlineSnapshot(`
        Object {
          "oneOf": Array [
            Object {
              "type": "string",
            },
            Object {
              "type": "number",
            },
            Object {
              "type": "boolean",
            },
          ],
        }
      `);
    });

    test("type reference", () => {
      expect(generateJsonSchemaType(referenceType("OtherType")))
        .toMatchInlineSnapshot(`
        Object {
          "$ref": "#/definitions/OtherType",
        }
      `);
    });
  });
});
