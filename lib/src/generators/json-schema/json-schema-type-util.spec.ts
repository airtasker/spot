import {
  arrayType,
  booleanLiteralType,
  booleanType,
  dateTimeType,
  dateType,
  doubleType,
  floatLiteralType,
  floatType,
  int32Type,
  int64Type,
  intersectionType,
  intLiteralType,
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  unionType
} from "../../types";
import { typeToJsonSchemaType } from "./json-schema-type-util";

describe("JSON schema generator", () => {
  describe("Null type", () => {
    test("converts to null schema", () => {
      const result = typeToJsonSchemaType(nullType());
      expect(result).toEqual({ type: "null" });
    });
  });

  describe("Boolean type", () => {
    test("converts to boolean schema", () => {
      const result = typeToJsonSchemaType(booleanType());
      expect(result).toEqual({ type: "boolean" });
    });
  });

  describe("Boolean literal type", () => {
    test("converts to boolean schema with true const for true value", () => {
      const result = typeToJsonSchemaType(booleanLiteralType(true));
      expect(result).toEqual({ type: "boolean", const: true });
    });

    test("converts to boolean schema with false const for false value", () => {
      const result = typeToJsonSchemaType(booleanLiteralType(false));
      expect(result).toEqual({ type: "boolean", const: false });
    });
  });

  describe("String type", () => {
    test("converts to string schema", () => {
      const result = typeToJsonSchemaType(stringType());
      expect(result).toEqual({ type: "string" });
    });
  });

  describe("String literal type", () => {
    test("converts to string schema with const", () => {
      const result = typeToJsonSchemaType(stringLiteralType("value"));
      expect(result).toEqual({ type: "string", const: "value" });
    });
  });

  describe("Float type", () => {
    test("converts to number schema with float format", () => {
      const result = typeToJsonSchemaType(floatType());
      expect(result).toEqual({ type: "number" });
    });
  });

  describe("Double type", () => {
    test("converts to number schema with double format", () => {
      const result = typeToJsonSchemaType(doubleType());
      expect(result).toEqual({ type: "number" });
    });
  });

  describe("Float literal type", () => {
    test("converts to number schema with float format and const", () => {
      const result = typeToJsonSchemaType(floatLiteralType(3.5));
      expect(result).toEqual({ type: "number", const: 3.5 });
    });
  });

  describe("Int32 type", () => {
    test("converts to integer schema with int32 format", () => {
      const result = typeToJsonSchemaType(int32Type());
      expect(result).toEqual({ type: "integer" });
    });
  });

  describe("Int64 type", () => {
    test("converts to integer schema with int64 format", () => {
      const result = typeToJsonSchemaType(int64Type());
      expect(result).toEqual({ type: "integer" });
    });
  });

  describe("Int literal type", () => {
    test("converts to integer schema with int32 format and const", () => {
      const result = typeToJsonSchemaType(intLiteralType(4));
      expect(result).toEqual({ type: "integer", const: 4 });
    });
  });

  describe("Date type", () => {
    test("converts to string schema with date format", () => {
      const result = typeToJsonSchemaType(dateType());
      expect(result).toEqual({ type: "string", format: "date" });
    });
  });

  describe("Date time type", () => {
    test("converts to string schema with date-time format", () => {
      const result = typeToJsonSchemaType(dateTimeType());
      expect(result).toEqual({ type: "string", format: "date-time" });
    });
  });

  describe("Object type", () => {
    test("converts to object schema", () => {
      const result = typeToJsonSchemaType(
        objectType([
          { name: "a", type: stringType(), optional: false },
          { name: "b", type: stringType(), optional: true }
        ])
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "string" }
        },
        required: ["a"],
        additionalProperties: true
      });
    });
  });

  describe("Array type", () => {
    test("converts to array schema", () => {
      const result = typeToJsonSchemaType(arrayType(stringType()));
      expect(result).toEqual({
        type: "array",
        items: { type: "string" }
      });
    });
  });

  describe("Union type", () => {
    describe("multiple single type literals", () => {
      test("true | false", () => {
        const result = typeToJsonSchemaType(
          unionType([booleanLiteralType(true), booleanLiteralType(false)])
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, false]
        });
      });

      test("true | false | null", () => {
        const result = typeToJsonSchemaType(
          unionType([
            booleanLiteralType(true),
            booleanLiteralType(false),
            nullType()
          ])
        );
        expect(result).toEqual({
          oneOf: [{ type: "null" }, { type: "boolean", enum: [true, false] }]
        });
      });

      test('"one" | "two" | "three"', () => {
        const result = typeToJsonSchemaType(
          unionType([
            stringLiteralType("one"),
            stringLiteralType("two"),
            stringLiteralType("three")
          ])
        );
        expect(result).toEqual({
          type: "string",
          enum: ["one", "two", "three"]
        });
      });

      test('"one" | "two" | "three" | null', () => {
        const result = typeToJsonSchemaType(
          unionType([
            stringLiteralType("one"),
            stringLiteralType("two"),
            stringLiteralType("three"),
            nullType()
          ])
        );
        expect(result).toEqual({
          oneOf: [
            { type: "null" },
            { type: "string", enum: ["one", "two", "three"] }
          ]
        });
      });

      test("1.1 | 1.2 | 1.3", () => {
        const result = typeToJsonSchemaType(
          unionType([
            floatLiteralType(1.1),
            floatLiteralType(1.2),
            floatLiteralType(1.3)
          ])
        );
        expect(result).toEqual({
          type: "number",
          enum: [1.1, 1.2, 1.3]
        });
      });

      test("1.1 | 1.2 | 1.3 | null", () => {
        const result = typeToJsonSchemaType(
          unionType([
            floatLiteralType(1.1),
            floatLiteralType(1.2),
            floatLiteralType(1.3),
            nullType()
          ])
        );
        expect(result).toEqual({
          oneOf: [{ type: "null" }, { type: "number", enum: [1.1, 1.2, 1.3] }]
        });
      });

      test("1 | 2 | 3", () => {
        const result = typeToJsonSchemaType(
          unionType([intLiteralType(1), intLiteralType(2), intLiteralType(3)])
        );
        expect(result).toEqual({
          type: "integer",
          enum: [1, 2, 3]
        });
      });

      test("1 | 2 | 3 | null", () => {
        const result = typeToJsonSchemaType(
          unionType([
            intLiteralType(1),
            intLiteralType(2),
            intLiteralType(3),
            nullType()
          ])
        );
        expect(result).toEqual({
          oneOf: [{ type: "null" }, { type: "integer", enum: [1, 2, 3] }]
        });
      });
    });

    describe("multiple unique types", () => {
      test("string | boolean", () => {
        const result = typeToJsonSchemaType(
          unionType([stringType(), booleanType()])
        );
        expect(result).toEqual({
          oneOf: [{ type: "string" }, { type: "boolean" }]
        });
      });

      test("string | boolean | null", () => {
        const result = typeToJsonSchemaType(
          unionType([stringType(), booleanType(), nullType()])
        );
        expect(result).toEqual({
          oneOf: [{ type: "string" }, { type: "boolean" }, { type: "null" }]
        });
      });

      test("1 | true", () => {
        const result = typeToJsonSchemaType(
          unionType([intLiteralType(1), booleanLiteralType(true)])
        );
        expect(result).toEqual({
          oneOf: [
            { type: "boolean", const: true },
            { type: "integer", const: 1 }
          ]
        });
      });

      test("1 | 2 | true", () => {
        const result = typeToJsonSchemaType(
          unionType([
            intLiteralType(1),
            intLiteralType(2),
            booleanLiteralType(true)
          ])
        );
        expect(result).toEqual({
          oneOf: [
            { type: "boolean", const: true },
            { type: "integer", enum: [1, 2] }
          ]
        });
      });

      test('{ type: "a"; a: string; } | { type: "b", b: string; }', () => {
        const result = typeToJsonSchemaType(
          unionType(
            [
              objectType([
                { name: "type", type: stringLiteralType("a"), optional: false },
                { name: "a", type: stringType(), optional: false }
              ]),
              objectType([
                { name: "type", type: stringLiteralType("b"), optional: false },
                { name: "b", type: stringType(), optional: false }
              ])
            ],
            "type"
          )
        );
        expect(result).toEqual({
          oneOf: [
            {
              type: "object",
              properties: {
                type: { type: "string", const: "a" },
                a: { type: "string" }
              },
              required: ["type", "a"],
              additionalProperties: true
            },
            {
              type: "object",
              properties: {
                type: { type: "string", const: "b" },
                b: { type: "string" }
              },
              required: ["type", "b"],
              additionalProperties: true
            }
          ]
        });
      });

      test('{ type: "a", a: string; } | CustomObjectTypeB', () => {
        const result = typeToJsonSchemaType(
          unionType(
            [
              objectType([
                { name: "type", type: stringLiteralType("a"), optional: false },
                { name: "a", type: stringType(), optional: false }
              ]),
              referenceType("CustomObjectTypeB")
            ],
            "type"
          )
        );
        expect(result).toEqual({
          oneOf: [
            {
              type: "object",
              properties: {
                type: { type: "string", const: "a" },
                a: { type: "string" }
              },
              required: ["type", "a"],
              additionalProperties: true
            },
            { $ref: "#/definitions/CustomObjectTypeB" }
          ]
        });
      });

      test("CustomObjectTypeA | CustomObjectTypeB", () => {
        const result = typeToJsonSchemaType(
          unionType(
            [
              referenceType("CustomObjectTypeA"),
              referenceType("CustomObjectTypeB")
            ],
            "type"
          )
        );
        expect(result).toEqual({
          oneOf: [
            { $ref: "#/definitions/CustomObjectTypeA" },
            { $ref: "#/definitions/CustomObjectTypeB" }
          ]
        });
      });

      test("CustomType | string", () => {
        const result = typeToJsonSchemaType(
          unionType([referenceType("CustomType"), booleanType()])
        );
        expect(result).toEqual({
          oneOf: [{ $ref: "#/definitions/CustomType" }, { type: "boolean" }]
        });
      });
    });
  });

  describe("referenceType", () => {
    test("converts to reference object", () => {
      const result = typeToJsonSchemaType(referenceType("CustomType"));
      expect(result).toEqual({
        $ref: "#/definitions/CustomType"
      });
    });
  });

  describe("intersectionType", () => {
    test("converts to an allOf schema object", () => {
      const result = typeToJsonSchemaType(
        intersectionType([
          objectType([
            { name: "type", type: stringLiteralType("a"), optional: false },
            { name: "a", type: stringType(), optional: false }
          ]),
          referenceType("CustomObjectTypeB")
        ])
      );
      expect(result).toEqual({
        allOf: [
          {
            additionalProperties: true,
            properties: {
              a: {
                type: "string"
              },
              type: {
                const: "a",
                type: "string"
              }
            },
            required: ["type", "a"],
            type: "object"
          },
          {
            $ref: "#/definitions/CustomObjectTypeB"
          }
        ]
      });
    });
  });
});
