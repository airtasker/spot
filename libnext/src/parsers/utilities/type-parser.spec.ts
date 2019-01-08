import { TypeNode } from "ts-simple-ast";
import { parseType } from "./type-parser";
import {
  STRING,
  NULL,
  NUMBER,
  BOOLEAN,
  Kind,
  UnionType,
  ObjectType
} from "../../models/types";
import { createSourceFile } from "../../test/helper";

describe("type parser", () => {
  describe("primitive types", () => {
    test("parses the null type", () => {
      const typeNode = createTypeNode("null");

      expect(parseType(typeNode)).toStrictEqual(NULL);
    });

    test("parses the boolean type", () => {
      const typeNode = createTypeNode("boolean");

      expect(parseType(typeNode)).toStrictEqual(BOOLEAN);
    });

    test("parses the string type", () => {
      const typeNode = createTypeNode("string");

      expect(parseType(typeNode)).toStrictEqual(STRING);
    });

    test("parses the number type", () => {
      const typeNode = createTypeNode("number");

      expect(parseType(typeNode)).toStrictEqual(NUMBER);
    });
  });

  describe("literal types", () => {
    test("parses literal true boolean", () => {
      const typeNode = createTypeNode("true");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.BooleanLiteral,
        value: true
      });
    });

    test("parses literal false boolean", () => {
      const typeNode = createTypeNode("false");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.BooleanLiteral,
        value: false
      });
    });

    test("parses literal string", () => {
      const typeNode = createTypeNode('"myStringLiteral"');

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.StringLiteral,
        value: "myStringLiteral"
      });
    });

    test("parses literal number", () => {
      const typeNode = createTypeNode("54");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.NumberLiteral,
        value: 54
      });
    });
  });

  describe("internal primitive reference types", () => {
    test("parses Int32 type", () => {
      const typeNode = createTypeNode("Int32");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.NumberReference,
        name: "Int32",
        location: expect.stringMatching(/syntax\/types\.ts$/)
      });
    });

    test("parses Int64 type", () => {
      const typeNode = createTypeNode("Int64");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.NumberReference,
        name: "Int64",
        location: expect.stringMatching(/syntax\/types\.ts$/)
      });
    });

    test("parses Date type", () => {
      const typeNode = createTypeNode("Date");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.StringReference,
        name: "Date",
        location: expect.stringMatching(/syntax\/types\.ts$/)
      });
    });

    test("parses DateTime type", () => {
      const typeNode = createTypeNode("DateTime");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.StringReference,
        name: "DateTime",
        location: expect.stringMatching(/syntax\/types\.ts$/)
      });
    });
  });

  describe("object types", () => {
    test("parses object literal type", () => {
      const titlePropName = "title";
      const titlePropDescription = "Some description for title";
      const yearPropName = "year";

      const typeNode = createTypeNode(`
        { 
          /** ${titlePropDescription} */
          ${titlePropName}: string;
          
          ${yearPropName}?: number;
        }
      `);

      const result = parseType(typeNode) as ObjectType;

      expect(result.kind).toEqual(Kind.Object);
      expect(result.properties).toHaveLength(2);
      expect(result.properties).toContainEqual({
        name: titlePropName,
        description: titlePropDescription,
        type: STRING,
        optional: false
      });
      expect(result.properties).toContainEqual({
        name: yearPropName,
        description: undefined,
        type: NUMBER,
        optional: true
      });
    });

    test("parses object interface type", () => {
      const typeNode = createTypeNode("ObjectInterface");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.ObjectReference,
        name: "ObjectInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses extended object interface type", () => {
      const typeNode = createTypeNode("ComplexInterface");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.ObjectReference,
        name: "ComplexInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses array type", () => {
      const typeNode = createTypeNode("string[]");

      expect(parseType(typeNode)).toStrictEqual({
        kind: Kind.Array,
        elements: STRING
      });
    });
  });

  describe("special types", () => {
    test("parses union types", () => {
      const typeNode = createTypeNode("string", "number", "null");

      const result = parseType(typeNode) as UnionType;

      expect(result.kind).toEqual(Kind.Union);
      expect(result.types).toHaveLength(3);
      expect(result.types).toContainEqual(STRING);
      expect(result.types).toContainEqual(NUMBER);
      expect(result.types).toContainEqual(NULL);
    });
  });
});

function createTypeNode(...types: string[]): TypeNode {
  if (types.length < 1) {
    throw new Error("at least one type required");
  }
  const interfaceName = "myInterface";
  const propertyName = "myPropertyName";
  const content = `
    import { Int32, Int64, Date, DateTime } from "@airtasker/spot"
    import { TypeAlias } from "./alias"

    interface ${interfaceName} {
      ${propertyName}: ${types.join(" | ")};
    }

    /** Object interface description */
    interface ObjectInterface {
      /** Name of person */
      name: string;

      /** Age of person */
      age: number;
    }

    /** Complex interface description */
    interface ComplexInterface extends ComplexInterfaceExtension {
      /** Name of person */
      name: string;
    }

    interface ComplexInterfaceExtension {
      /** Number of siblings */
      siblings: number;
    }
  `;
  const sourceFile = createSourceFile(
    { path: "main", content: content },
    { path: "alias", content: `export type TypeAlias = string;` }
  );
  const interphace = sourceFile.getInterfaceOrThrow(interfaceName);
  const property = interphace.getPropertyOrThrow(propertyName);
  const typeNode = property.getTypeNodeOrThrow();

  return typeNode;
}
