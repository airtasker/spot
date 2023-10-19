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
  TypeTable,
  unionType
} from "../../types";
import { typeToSchemaOrReferenceObject } from "./openapi3-type-util";

describe("OpenAPI 3 type util", () => {
  describe("Null type", () => {
    test("fails to convert to schema", () => {
      expect(() =>
        typeToSchemaOrReferenceObject(nullType(), new TypeTable())
      ).toThrow("Null must be part of a union for OpenAPI 3");
    });
  });

  describe("Boolean type", () => {
    test("converts to boolean schema", () => {
      const result = typeToSchemaOrReferenceObject(
        booleanType(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "boolean" });
    });
  });

  describe("Boolean literal type", () => {
    test("converts to boolean schema with true enum for true value", () => {
      const result = typeToSchemaOrReferenceObject(
        booleanLiteralType(true),
        new TypeTable()
      );
      expect(result).toEqual({ type: "boolean", enum: [true] });
    });

    test("converts to boolean schema with false enum for false value", () => {
      const result = typeToSchemaOrReferenceObject(
        booleanLiteralType(false),
        new TypeTable()
      );
      expect(result).toEqual({ type: "boolean", enum: [false] });
    });
  });

  describe("String type", () => {
    test("converts to string schema", () => {
      const result = typeToSchemaOrReferenceObject(
        stringType(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "string" });
    });
  });

  describe("String literal type", () => {
    test("converts to string schema with enum", () => {
      const result = typeToSchemaOrReferenceObject(
        stringLiteralType("value"),
        new TypeTable()
      );
      expect(result).toEqual({ type: "string", enum: ["value"] });
    });
  });

  describe("Float type", () => {
    test("converts to number schema with float format", () => {
      const result = typeToSchemaOrReferenceObject(
        floatType(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "number", format: "float" });
    });
  });

  describe("Double type", () => {
    test("converts to number schema with double format", () => {
      const result = typeToSchemaOrReferenceObject(
        doubleType(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "number", format: "double" });
    });
  });

  describe("Float literal type", () => {
    test("converts to number schema with float format and enum", () => {
      const result = typeToSchemaOrReferenceObject(
        floatLiteralType(3.5),
        new TypeTable()
      );
      expect(result).toEqual({ type: "number", format: "float", enum: [3.5] });
    });
  });

  describe("Int32 type", () => {
    test("converts to integer schema with int32 format", () => {
      const result = typeToSchemaOrReferenceObject(
        int32Type(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "integer", format: "int32" });
    });
  });

  describe("Int64 type", () => {
    test("converts to integer schema with int64 format", () => {
      const result = typeToSchemaOrReferenceObject(
        int64Type(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "integer", format: "int64" });
    });
  });

  describe("Int literal type", () => {
    test("converts to integer schema with int32 format and enum", () => {
      const result = typeToSchemaOrReferenceObject(
        intLiteralType(4),
        new TypeTable()
      );
      expect(result).toEqual({ type: "integer", format: "int32", enum: [4] });
    });
  });

  describe("Date type", () => {
    test("converts to string schema with date format", () => {
      const result = typeToSchemaOrReferenceObject(dateType(), new TypeTable());
      expect(result).toEqual({ type: "string", format: "date" });
    });
  });

  describe("Date time type", () => {
    test("converts to string schema with date-time format", () => {
      const result = typeToSchemaOrReferenceObject(
        dateTimeType(),
        new TypeTable()
      );
      expect(result).toEqual({ type: "string", format: "date-time" });
    });
  });

  describe("Object type", () => {
    test("converts to object schema", () => {
      const result = typeToSchemaOrReferenceObject(
        objectType([
          {
            name: "a",
            type: stringType(),
            optional: false,
            description: "description"
          },
          { name: "b", type: stringType(), optional: true }
        ]),
        new TypeTable()
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: { type: "string", description: "description" },
          b: { type: "string" }
        },
        required: ["a"]
      });
    });
  });

  describe("Array type", () => {
    test("converts to array schema", () => {
      const result = typeToSchemaOrReferenceObject(
        arrayType(stringType()),
        new TypeTable()
      );
      expect(result).toEqual({
        type: "array",
        items: { type: "string" }
      });
    });
  });

  describe("Union type", () => {
    describe("single type and null", () => {
      test("boolean | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([booleanType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({ type: "boolean", nullable: true });
      });

      test("true | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([booleanLiteralType(true), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, null],
          nullable: true
        });
      });

      test("false | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([booleanLiteralType(false), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [false, null],
          nullable: true
        });
      });

      test("string | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([stringType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({ type: "string", nullable: true });
      });

      test('"custom" | null', () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([stringLiteralType("custom"), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          enum: ["custom", null],
          nullable: true
        });
      });

      test("Float | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([floatType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          nullable: true
        });
      });

      test("Double | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([doubleType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "double",
          nullable: true
        });
      });

      test("3.5 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([floatLiteralType(3.5), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          enum: [3.5, null],
          nullable: true
        });
      });

      test("Int32 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([int32Type(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          nullable: true
        });
      });

      test("Int64 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([int64Type(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int64",
          nullable: true
        });
      });

      test("4 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([intLiteralType(4), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          enum: [4, null],
          nullable: true
        });
      });

      test("Date | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([dateType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          format: "date",
          nullable: true
        });
      });

      test("DateTime | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([dateTimeType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          format: "date-time",
          nullable: true
        });
      });

      test("{ a: string; b?: string; } | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            objectType([
              { name: "a", type: stringType(), optional: false },
              { name: "b", type: stringType(), optional: true }
            ]),
            nullType()
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "object",
          properties: {
            a: { type: "string" },
            b: { type: "string" }
          },
          required: ["a"],
          nullable: true
        });
      });

      test("string[] | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([arrayType(stringType()), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "array",
          items: { type: "string" },
          nullable: true
        });
      });

      test("CustomType | null", () => {
        const typeTable = new TypeTable();
        typeTable.add("CustomType", { type: stringType() });

        const result = typeToSchemaOrReferenceObject(
          unionType([referenceType("CustomType"), nullType()]),
          typeTable
        );
        expect(result).toEqual({
          $ref: "#/components/schemas/CustomType",
          nullable: true
        });
      });
    });

    describe("multiple single type literals", () => {
      test("true | false", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([booleanLiteralType(true), booleanLiteralType(false)]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, false]
        });
      });

      test("true | false | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            booleanLiteralType(true),
            booleanLiteralType(false),
            nullType()
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, false, null],
          nullable: true
        });
      });

      test('"one" | "two" | "three"', () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            stringLiteralType("one"),
            stringLiteralType("two"),
            stringLiteralType("three")
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          enum: ["one", "two", "three"]
        });
      });

      test('"one" | "two" | "three" | null', () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            stringLiteralType("one"),
            stringLiteralType("two"),
            stringLiteralType("three"),
            nullType()
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          enum: ["one", "two", "three", null],
          nullable: true
        });
      });

      test("1.1 | 1.2 | 1.3", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            floatLiteralType(1.1),
            floatLiteralType(1.2),
            floatLiteralType(1.3)
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          enum: [1.1, 1.2, 1.3]
        });
      });

      test("1.1 | 1.2 | 1.3 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            floatLiteralType(1.1),
            floatLiteralType(1.2),
            floatLiteralType(1.3),
            nullType()
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          enum: [1.1, 1.2, 1.3, null],
          nullable: true
        });
      });

      test("1 | 2 | 3", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([intLiteralType(1), intLiteralType(2), intLiteralType(3)]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          enum: [1, 2, 3]
        });
      });

      test("1 | 2 | 3 | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([
            intLiteralType(1),
            intLiteralType(2),
            intLiteralType(3),
            nullType()
          ]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          enum: [1, 2, 3, null],
          nullable: true
        });
      });
    });

    describe("multiple unique types", () => {
      test("string | boolean", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([stringType(), booleanType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          oneOf: [{ type: "string" }, { type: "boolean" }]
        });
      });

      test("string | boolean | null", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([stringType(), booleanType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          oneOf: [{ type: "string" }, { type: "boolean" }],
          nullable: true
        });
      });

      test("1 | true", () => {
        const result = typeToSchemaOrReferenceObject(
          unionType([intLiteralType(1), booleanLiteralType(true)]),
          new TypeTable()
        );
        expect(result).toEqual({
          oneOf: [
            { type: "integer", format: "int32", enum: [1] },
            { type: "boolean", enum: [true] }
          ]
        });
      });

      test('{ type: "a"; a: string; } | { type: "b", b: string; }', () => {
        const result = typeToSchemaOrReferenceObject(
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
          ),
          new TypeTable()
        );
        expect(result).toEqual({
          oneOf: [
            {
              type: "object",
              properties: {
                type: { type: "string", enum: ["a"] },
                a: { type: "string" }
              },
              required: ["type", "a"]
            },
            {
              type: "object",
              properties: {
                type: { type: "string", enum: ["b"] },
                b: { type: "string" }
              },
              required: ["type", "b"]
            }
          ],
          discriminator: {
            propertyName: "type"
          }
        });
      });

      test('{ type: "a", a: string; } | CustomObjectTypeB', () => {
        const typeTable = new TypeTable();
        typeTable.add("CustomObjectTypeB", {
          type: objectType([
            { name: "type", type: stringLiteralType("b"), optional: false },
            { name: "b", type: stringType(), optional: false }
          ])
        });

        const result = typeToSchemaOrReferenceObject(
          unionType(
            [
              objectType([
                { name: "type", type: stringLiteralType("a"), optional: false },
                { name: "a", type: stringType(), optional: false }
              ]),
              referenceType("CustomObjectTypeB")
            ],
            "type"
          ),
          typeTable
        );
        expect(result).toEqual({
          oneOf: [
            {
              type: "object",
              properties: {
                type: { type: "string", enum: ["a"] },
                a: { type: "string" }
              },
              required: ["type", "a"]
            },
            { $ref: "#/components/schemas/CustomObjectTypeB" }
          ],
          discriminator: {
            propertyName: "type"
          }
        });
      });

      test("CustomObjectTypeA | CustomObjectTypeB", () => {
        const typeTable = new TypeTable();
        typeTable.add("CustomObjectTypeA", {
          type: objectType([
            { name: "type", type: stringLiteralType("a"), optional: false },
            { name: "a", type: stringType(), optional: false }
          ])
        });
        typeTable.add("CustomObjectTypeB", {
          type: objectType([
            { name: "type", type: stringLiteralType("b"), optional: false },
            { name: "b", type: stringType(), optional: false }
          ])
        });

        const result = typeToSchemaOrReferenceObject(
          unionType(
            [
              referenceType("CustomObjectTypeA"),
              referenceType("CustomObjectTypeB")
            ],
            "type"
          ),
          typeTable
        );
        expect(result).toEqual({
          oneOf: [
            { $ref: "#/components/schemas/CustomObjectTypeA" },
            { $ref: "#/components/schemas/CustomObjectTypeB" }
          ],
          discriminator: {
            propertyName: "type",
            mapping: {
              a: "#/components/schemas/CustomObjectTypeA",
              b: "#/components/schemas/CustomObjectTypeB"
            }
          }
        });
      });

      test("CustomType | boolean", () => {
        const typeTable = new TypeTable();
        typeTable.add("CustomType", { type: stringType() });

        const result = typeToSchemaOrReferenceObject(
          unionType([referenceType("CustomType"), booleanType()]),
          typeTable
        );
        expect(result).toEqual({
          oneOf: [
            { $ref: "#/components/schemas/CustomType" },
            { type: "boolean" }
          ]
        });
      });
    });
  });

  describe("Reference type", () => {
    test("converts to reference object", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaOrReferenceObject(
        referenceType("CustomType"),
        typeTable
      );
      expect(result).toEqual({
        $ref: "#/components/schemas/CustomType"
      });
    });
  });

  describe("intersectionType", () => {
    test("converts to an allOf schema object", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaOrReferenceObject(
        intersectionType([
          objectType([
            { name: "type", type: stringLiteralType("a"), optional: false },
            { name: "a", type: stringType(), optional: false }
          ]),
          referenceType("CustomObjectTypeB")
        ]),
        typeTable
      );
      expect(result).toEqual({
        allOf: [
          {
            properties: {
              a: {
                type: "string"
              },
              type: {
                enum: ["a"],
                type: "string"
              }
            },
            required: ["type", "a"],
            type: "object"
          },
          {
            $ref: "#/components/schemas/CustomObjectTypeB"
          }
        ]
      });
    });
    test("handles a union with an intersection", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomObjectTypeA", {
        type: objectType([
          { name: "type", type: stringLiteralType("a"), optional: false },
          { name: "a", type: stringType(), optional: false }
        ])
      });
      typeTable.add("CustomObjectTypeB", {
        type: objectType([
          { name: "type", type: stringLiteralType("b"), optional: false },
          { name: "b", type: stringType(), optional: false }
        ])
      });
      typeTable.add("CustomObjectTypeC", {
        type: intersectionType([
          objectType([
            { name: "type", type: stringLiteralType("c"), optional: false }
          ]),
          objectType([{ name: "c", type: stringType(), optional: false }])
        ])
      });
      const result = typeToSchemaOrReferenceObject(
        unionType(
          [
            referenceType("CustomObjectTypeA"),
            referenceType("CustomObjectTypeB"),
            referenceType("CustomObjectTypeC")
          ],
          "type"
        ),
        typeTable
      );
      expect(result).toEqual({
        oneOf: [
          { $ref: "#/components/schemas/CustomObjectTypeA" },
          { $ref: "#/components/schemas/CustomObjectTypeB" },
          { $ref: "#/components/schemas/CustomObjectTypeC" }
        ],
        discriminator: {
          propertyName: "type",
          mapping: {
            a: "#/components/schemas/CustomObjectTypeA",
            b: "#/components/schemas/CustomObjectTypeB",
            c: "#/components/schemas/CustomObjectTypeC"
          }
        }
      });
    });
  });
});
