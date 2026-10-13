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
  Type,
  TypeTable,
  unionType
} from "../../types";
import { SchemaObject } from "./openapi3-1-specification";
import { typeToSchemaObject } from "./openapi3-1-type-util";

describe("OpenAPI 3.1 type util", () => {
  describe("primitive and literal types", () => {
    it.each<[string, Type, SchemaObject]>([
      ["boolean", booleanType(), { type: "boolean" }],
      ["true", booleanLiteralType(true), { type: "boolean", enum: [true] }],
      ["false", booleanLiteralType(false), { type: "boolean", enum: [false] }],
      ["string", stringType(), { type: "string" }],
      [
        "string literal",
        stringLiteralType("value"),
        { type: "string", enum: ["value"] }
      ],
      ["Float", floatType(), { type: "number", format: "float" }],
      ["Double", doubleType(), { type: "number", format: "double" }],
      [
        "float literal",
        floatLiteralType(3.5),
        { type: "number", format: "float", enum: [3.5] }
      ],
      ["Int32", int32Type(), { type: "integer", format: "int32" }],
      ["Int64", int64Type(), { type: "integer", format: "int64" }],
      [
        "int literal",
        intLiteralType(4),
        { type: "integer", format: "int32", enum: [4] }
      ],
      ["Date", dateType(), { type: "string", format: "date" }],
      ["DateTime", dateTimeType(), { type: "string", format: "date-time" }]
    ])("%s", (_, type, expected) => {
      expect(typeToSchemaObject(type, new TypeTable())).toEqual(expected);
    });
  });

  describe("Object type", () => {
    test("converts to object schema", () => {
      const result = typeToSchemaObject(
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

    test("omits properties and required when there are no properties", () => {
      expect(typeToSchemaObject(objectType([]), new TypeTable())).toEqual({
        type: "object"
      });
    });

    test("keeps a property description beside $ref", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = typeToSchemaObject(
        objectType([
          {
            name: "a",
            type: referenceType("CustomType"),
            optional: false,
            description: "description"
          }
        ]),
        typeTable
      );
      expect(result).toEqual({
        type: "object",
        properties: {
          a: {
            $ref: "#/components/schemas/CustomType",
            description: "description"
          }
        },
        required: ["a"]
      });
    });
  });

  describe("Array type", () => {
    test("converts to array schema", () => {
      expect(
        typeToSchemaObject(arrayType(stringType()), new TypeTable())
      ).toEqual({
        type: "array",
        items: { type: "string" }
      });
    });
  });

  describe("Reference type", () => {
    test("converts to $ref", () => {
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      expect(
        typeToSchemaObject(referenceType("CustomType"), typeTable)
      ).toEqual({ $ref: "#/components/schemas/CustomType" });
    });
  });

  describe("Union of literals of one kind", () => {
    it.each<[string, Type, SchemaObject]>([
      [
        "true | false",
        unionType([booleanLiteralType(true), booleanLiteralType(false)]),
        { type: "boolean", enum: [true, false] }
      ],
      [
        '"one" | "two" | "three"',
        unionType([
          stringLiteralType("one"),
          stringLiteralType("two"),
          stringLiteralType("three")
        ]),
        { type: "string", enum: ["one", "two", "three"] }
      ],
      [
        "1.1 | 1.2 | 1.3",
        unionType([
          floatLiteralType(1.1),
          floatLiteralType(1.2),
          floatLiteralType(1.3)
        ]),
        { type: "number", format: "float", enum: [1.1, 1.2, 1.3] }
      ],
      [
        "1 | 2 | 3",
        unionType([intLiteralType(1), intLiteralType(2), intLiteralType(3)]),
        { type: "integer", format: "int32", enum: [1, 2, 3] }
      ]
    ])("%s", (_, type, expected) => {
      expect(typeToSchemaObject(type, new TypeTable())).toEqual(expected);
    });
  });

  describe("schemaprops", () => {
    test("are copied onto the schema", () => {
      const result = typeToSchemaObject(
        {
          ...stringType(),
          schemaProps: [
            { name: "title", value: "a title" },
            { name: "minLength", value: 2 }
          ]
        },
        new TypeTable()
      );
      expect(result).toEqual({
        type: "string",
        title: "a title",
        minLength: 2
      });
    });

    it.each(["example", "exclusiveMinimum", "exclusiveMaximum"])(
      "%s is rejected",
      name => {
        expect(() =>
          typeToSchemaObject(
            { ...int32Type(), schemaProps: [{ name, value: true }] },
            new TypeTable()
          )
        ).toThrow(
          `The "${name}" schemaprop is not supported by the OpenAPI 3.1 generator`
        );
      }
    );
  });

  describe("unsupported types", () => {
    it.each<[string, Type, string]>([
      ["null", nullType(), "The null type"],
      [
        "string | null",
        unionType([stringType(), nullType()]),
        "A union with null"
      ],
      [
        '"a" | "b" | null',
        unionType([stringLiteralType("a"), stringLiteralType("b"), nullType()]),
        "A union with null"
      ],
      [
        "string | boolean",
        unionType([stringType(), booleanType()]),
        "A union other than a union of literals of one kind"
      ],
      [
        "1 | true",
        unionType([intLiteralType(1), booleanLiteralType(true)]),
        "A union other than a union of literals of one kind"
      ],
      [
        "a single-member union",
        unionType([stringType()]),
        "A union other than a union of literals of one kind"
      ],
      [
        "an intersection",
        intersectionType([
          objectType([{ name: "a", type: stringType(), optional: false }]),
          objectType([{ name: "b", type: stringType(), optional: false }])
        ]),
        "An intersection type"
      ]
    ])("%s", (_, type, subject) => {
      expect(() => typeToSchemaObject(type, new TypeTable())).toThrow(
        `${subject} is not supported by the OpenAPI 3.1 generator`
      );
    });
  });
});
