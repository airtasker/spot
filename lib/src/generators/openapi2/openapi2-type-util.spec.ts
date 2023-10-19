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
import { typeToSchemaObject } from "./openapi2-type-util";

describe("OpenAPI 2 type util", () => {
  describe("Null type", () => {
    test("fails to convert to schema", () => {
      expect(() => typeToSchemaObject(nullType(), new TypeTable())).toThrow(
        "Null must be part of a union for OpenAPI 2"
      );
    });
  });

  describe("Boolean type", () => {
    test("converts to boolean schema", () => {
      const result = typeToSchemaObject(booleanType(), new TypeTable());
      expect(result).toEqual({ type: "boolean" });
    });
  });

  describe("Boolean literal type", () => {
    test("converts to boolean schema with true enum for true value", () => {
      const result = typeToSchemaObject(
        booleanLiteralType(true),
        new TypeTable()
      );
      expect(result).toEqual({ type: "boolean", enum: [true] });
    });

    test("converts to boolean schema with false enum for false value", () => {
      const result = typeToSchemaObject(
        booleanLiteralType(false),
        new TypeTable()
      );
      expect(result).toEqual({ type: "boolean", enum: [false] });
    });
  });

  describe("String type", () => {
    test("converts to string schema", () => {
      const result = typeToSchemaObject(stringType(), new TypeTable());
      expect(result).toEqual({ type: "string" });
    });
  });

  describe("String literal type", () => {
    test("converts to string schema with enum", () => {
      const result = typeToSchemaObject(
        stringLiteralType("value"),
        new TypeTable()
      );
      expect(result).toEqual({ type: "string", enum: ["value"] });
    });
  });

  describe("Float type", () => {
    test("converts to number schema with float format", () => {
      const result = typeToSchemaObject(floatType(), new TypeTable());
      expect(result).toEqual({ type: "number", format: "float" });
    });
  });

  describe("Double type", () => {
    test("converts to number schema with double format", () => {
      const result = typeToSchemaObject(doubleType(), new TypeTable());
      expect(result).toEqual({ type: "number", format: "double" });
    });
  });

  describe("Float literal type", () => {
    test("converts to number schema with float format and enum", () => {
      const result = typeToSchemaObject(floatLiteralType(3.5), new TypeTable());
      expect(result).toEqual({ type: "number", format: "float", enum: [3.5] });
    });
  });

  describe("Int32 type", () => {
    test("converts to integer schema with int32 format", () => {
      const result = typeToSchemaObject(int32Type(), new TypeTable());
      expect(result).toEqual({ type: "integer", format: "int32" });
    });
  });

  describe("Int64 type", () => {
    test("converts to integer schema with int64 format", () => {
      const result = typeToSchemaObject(int64Type(), new TypeTable());
      expect(result).toEqual({ type: "integer", format: "int64" });
    });
  });

  describe("Int literal type", () => {
    test("converts to integer schema with int32 format and enum", () => {
      const result = typeToSchemaObject(intLiteralType(4), new TypeTable());
      expect(result).toEqual({ type: "integer", format: "int32", enum: [4] });
    });
  });

  describe("Date type", () => {
    test("converts to string schema with date format", () => {
      const result = typeToSchemaObject(dateType(), new TypeTable());
      expect(result).toEqual({ type: "string", format: "date" });
    });
  });

  describe("Date time type", () => {
    test("converts to string schema with date-time format", () => {
      const result = typeToSchemaObject(dateTimeType(), new TypeTable());
      expect(result).toEqual({ type: "string", format: "date-time" });
    });
  });

  describe("Object type", () => {
    test("converts to object schema", () => {
      const result = typeToSchemaObject(
        objectType([
          { name: "a", type: stringType(), optional: false },
          { name: "b", type: stringType(), optional: true }
        ]),
        new TypeTable()
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "string" }
        },
        required: ["a"]
      });
    });
  });

  describe("Array type", () => {
    test("converts to array schema", () => {
      const result = typeToSchemaObject(
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
        const result = typeToSchemaObject(
          unionType([booleanType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({ type: "boolean", "x-nullable": true });
      });

      test("true | null", () => {
        const result = typeToSchemaObject(
          unionType([booleanLiteralType(true), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, null],
          "x-nullable": true
        });
      });

      test("false | null", () => {
        const result = typeToSchemaObject(
          unionType([booleanLiteralType(false), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [false, null],
          "x-nullable": true
        });
      });

      test("string | null", () => {
        const result = typeToSchemaObject(
          unionType([stringType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({ type: "string", "x-nullable": true });
      });

      test('"custom" | null', () => {
        const result = typeToSchemaObject(
          unionType([stringLiteralType("custom"), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          enum: ["custom", null],
          "x-nullable": true
        });
      });

      test("Float | null", () => {
        const result = typeToSchemaObject(
          unionType([floatType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          "x-nullable": true
        });
      });

      test("Double | null", () => {
        const result = typeToSchemaObject(
          unionType([doubleType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "double",
          "x-nullable": true
        });
      });

      test("3.5 | null", () => {
        const result = typeToSchemaObject(
          unionType([floatLiteralType(3.5), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "number",
          format: "float",
          enum: [3.5, null],
          "x-nullable": true
        });
      });

      test("Int32 | null", () => {
        const result = typeToSchemaObject(
          unionType([int32Type(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          "x-nullable": true
        });
      });

      test("Int64 | null", () => {
        const result = typeToSchemaObject(
          unionType([int64Type(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int64",
          "x-nullable": true
        });
      });

      test("4 | null", () => {
        const result = typeToSchemaObject(
          unionType([intLiteralType(4), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "integer",
          format: "int32",
          enum: [4, null],
          "x-nullable": true
        });
      });

      test("Date | null", () => {
        const result = typeToSchemaObject(
          unionType([dateType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          format: "date",
          "x-nullable": true
        });
      });

      test("DateTime | null", () => {
        const result = typeToSchemaObject(
          unionType([dateTimeType(), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "string",
          format: "date-time",
          "x-nullable": true
        });
      });

      test("{ a: string; b?: string; } | null", () => {
        const result = typeToSchemaObject(
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
          "x-nullable": true
        });
      });

      test("string[] | null", () => {
        const result = typeToSchemaObject(
          unionType([arrayType(stringType()), nullType()]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "array",
          items: { type: "string" },
          "x-nullable": true
        });
      });

      test("CustomType | null", () => {
        const typeTable = new TypeTable();
        typeTable.add("CustomType", { type: stringType() });

        const result = typeToSchemaObject(
          unionType([referenceType("CustomType"), nullType()]),
          typeTable
        );
        expect(result).toEqual({
          allOf: [{ $ref: "#/definitions/CustomType" }],
          "x-nullable": true
        });
      });
    });

    describe("multiple single type literals", () => {
      test("true | false", () => {
        const result = typeToSchemaObject(
          unionType([booleanLiteralType(true), booleanLiteralType(false)]),
          new TypeTable()
        );
        expect(result).toEqual({
          type: "boolean",
          enum: [true, false]
        });
      });

      test("true | false | null", () => {
        const result = typeToSchemaObject(
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
          "x-nullable": true
        });
      });

      test('"one" | "two" | "three"', () => {
        const result = typeToSchemaObject(
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
        const result = typeToSchemaObject(
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
          "x-nullable": true
        });
      });

      test("1.1 | 1.2 | 1.3", () => {
        const result = typeToSchemaObject(
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
        const result = typeToSchemaObject(
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
          "x-nullable": true
        });
      });

      test("1 | 2 | 3", () => {
        const result = typeToSchemaObject(
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
        const result = typeToSchemaObject(
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
          "x-nullable": true
        });
      });
    });

    describe("multiple unique types", () => {
      test("fails to convert to schema", () => {
        expect(() =>
          typeToSchemaObject(
            unionType([stringType(), booleanType()]),
            new TypeTable()
          )
        ).toThrow("Unions are not supported in OpenAPI 2");
      });
    });
  });

  describe("referenceType", () => {
    test("converts to reference object", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaObject(referenceType("CustomType"), typeTable);
      expect(result).toEqual({
        $ref: "#/definitions/CustomType"
      });
    });
  });

  describe("intersectionType", () => {
    test("converts to an allOf schema object", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaObject(
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
            $ref: "#/definitions/CustomObjectTypeB"
          }
        ]
      });
    });
  });
});
