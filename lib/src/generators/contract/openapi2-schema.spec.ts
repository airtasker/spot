import {
  arrayType,
  BOOLEAN,
  booleanLiteral,
  FLOAT,
  INT32,
  INT64,
  NULL,
  numberLiteral,
  objectType,
  referenceType,
  STRING,
  stringLiteral,
  TypeKind,
  unionType
} from "../../models/types";
import { openApi2TypeSchema } from "./openapi2-schema";

describe("OpenAPI 2 generator", () => {
  describe("generates type validator", () => {
    test("null", () => {
      expect(() => openApi2TypeSchema(NULL)).toThrowError(
        "The null type is only supported within a union in OpenAPI 2."
      );
    });

    test("boolean", () => {
      expect(openApi2TypeSchema(BOOLEAN)).toMatchInlineSnapshot(`
        Object {
          "type": "boolean",
        }
      `);
    });

    test("boolean literal", () => {
      expect(openApi2TypeSchema(booleanLiteral(true))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            true,
          ],
          "type": "boolean",
        }
      `);
      expect(openApi2TypeSchema(booleanLiteral(false))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            false,
          ],
          "type": "boolean",
        }
      `);
    });

    test("string", () => {
      expect(openApi2TypeSchema(STRING)).toMatchInlineSnapshot(`
        Object {
          "type": "string",
        }
      `);
    });

    test("string literal", () => {
      expect(openApi2TypeSchema(stringLiteral("some literal")))
        .toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            "some literal",
          ],
          "type": "string",
        }
      `);
    });

    test("float", () => {
      expect(openApi2TypeSchema(FLOAT)).toMatchInlineSnapshot(`
        Object {
          "format": "float",
          "type": "number",
        }
      `);
    });

    test("number literal", () => {
      expect(openApi2TypeSchema(numberLiteral(1.5))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            1.5,
          ],
          "type": "number",
        }
      `);
      expect(openApi2TypeSchema(numberLiteral(-23.1))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            -23.1,
          ],
          "type": "number",
        }
      `);
    });

    test("int32", () => {
      expect(openApi2TypeSchema(INT32)).toMatchInlineSnapshot(`
        Object {
          "format": "int32",
          "type": "integer",
        }
      `);
    });

    test("int64", () => {
      expect(openApi2TypeSchema(INT64)).toMatchInlineSnapshot(`
        Object {
          "format": "int64",
          "type": "integer",
        }
      `);
    });

    test("integer literal", () => {
      expect(openApi2TypeSchema(numberLiteral(0))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            0,
          ],
          "type": "integer",
        }
      `);
      expect(openApi2TypeSchema(numberLiteral(122))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            122,
          ],
          "type": "integer",
        }
      `);
      expect(openApi2TypeSchema(numberLiteral(-1000))).toMatchInlineSnapshot(`
        Object {
          "enum": Array [
            -1000,
          ],
          "type": "integer",
        }
      `);
    });

    test("object", () => {
      expect(openApi2TypeSchema(objectType([]))).toMatchInlineSnapshot(`
        Object {
          "properties": Object {},
          "required": Array [],
          "type": "object",
        }
      `);
      expect(
        openApi2TypeSchema(
          objectType([
            {
              name: "singleField",
              type: FLOAT,
              optional: false
            }
          ])
        )
      ).toMatchInlineSnapshot(`
        Object {
          "properties": Object {
            "singleField": Object {
              "format": "float",
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
        openApi2TypeSchema(
          objectType([
            {
              name: "field1",
              type: FLOAT,
              optional: false
            },
            {
              name: "field2",
              type: STRING,
              optional: false
            },
            {
              name: "field3",
              type: BOOLEAN,
              optional: true
            }
          ])
        )
      ).toMatchInlineSnapshot(`
        Object {
          "properties": Object {
            "field1": Object {
              "format": "float",
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
      expect(openApi2TypeSchema(arrayType(STRING))).toMatchInlineSnapshot(`
        Object {
          "items": Object {
            "type": "string",
          },
          "type": "array",
        }
      `);
    });

    test("union", () => {
      expect(openApi2TypeSchema(unionType([STRING]))).toMatchInlineSnapshot(`
        Object {
          "type": "string",
        }
      `);
      expect(openApi2TypeSchema(unionType([STRING, NULL])))
        .toMatchInlineSnapshot(`
        Object {
          "type": "string",
          "x-nullable": true,
        }
      `);
      expect(() =>
        openApi2TypeSchema(unionType([STRING, FLOAT, BOOLEAN]))
      ).toThrowError("Unions are not supported in OpenAPI 2");
    });

    test("type reference", () => {
      expect(
        openApi2TypeSchema(
          referenceType("OtherType", "location", TypeKind.STRING)
        )
      ).toMatchInlineSnapshot(`
        Object {
          "$ref": "#/definitions/OtherType",
        }
      `);
    });
  });
});
