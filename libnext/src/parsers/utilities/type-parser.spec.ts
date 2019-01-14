import { TypeNode } from "ts-simple-ast";
import {
  BOOLEAN,
  NULL,
  NUMBER,
  ObjectType,
  STRING,
  TypeKind,
  UnionType
} from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseInterfaceDeclaration, parseType } from "./type-parser";

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
        kind: TypeKind.BOOLEAN_LITERAL,
        value: true
      });
    });

    test("parses literal false boolean", () => {
      const typeNode = createTypeNode("false");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.BOOLEAN_LITERAL,
        value: false
      });
    });

    test("parses literal string", () => {
      const typeNode = createTypeNode('"myStringLiteral"');

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.STRING_LITERAL,
        value: "myStringLiteral"
      });
    });

    test("parses literal number", () => {
      const typeNode = createTypeNode("54");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.NUMBER_LITERAL,
        value: 54
      });
    });

    test("parses type aliased literal", () => {
      const typeNode = createTypeNode("TrueAlias");
      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.BOOLEAN_LITERAL,
        name: "TrueAlias",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });

  describe("internal custom primitive types", () => {
    test("parses Integer type", () => {
      const typeNode = createTypeNode("Integer");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.INTEGER
      });
    });

    test("parses Date type", () => {
      const typeNode = createTypeNode("Date");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.DATE
      });
    });

    test("parses DateTime type", () => {
      const typeNode = createTypeNode("DateTime");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.DATE_TIME
      });
    });

    test("parses aliased custom primitive", () => {
      const typeNode = createTypeNode("AliasedCustomPrimitive");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.INTEGER,
        name: "AliasedCustomPrimitive",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });

  describe("external custom primitive types", () => {
    test("parses custom string", () => {
      const typeNode = createTypeNode("TypeAlias");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.STRING,
        name: "TypeAlias",
        location: expect.stringMatching(/alias\.ts$/)
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

      expect(result.kind).toEqual(TypeKind.OBJECT);
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
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.OBJECT,
        name: "ObjectInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses extended object interface type", () => {
      const typeNode = createTypeNode("ComplexInterface");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.OBJECT,
        name: "ComplexInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses array type", () => {
      const typeNode = createTypeNode("string[]");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.ARRAY,
        elements: STRING
      });
    });
  });

  describe("special types", () => {
    test("parses union types", () => {
      const typeNode = createTypeNode("string", "number", "null");

      const result = parseType(typeNode) as UnionType;

      expect(result.kind).toEqual(TypeKind.UNION);
      expect(result.types).toHaveLength(3);
      expect(result.types).toContainEqual(STRING);
      expect(result.types).toContainEqual(NUMBER);
      expect(result.types).toContainEqual(NULL);
    });

    test("parses chained type alias", () => {
      const typeNode = createTypeNode("ChainedAlias");

      expect(parseType(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.TYPE_REFERENCE,
        name: "ChainedAlias",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });
});

describe("interface parser", () => {
  test("resolves all properties from base types", () => {
    const sourceFile = createSourceFile({
      path: "main",
      content: `
        interface Target extends A {
          target: string;
        }
        interface A extends B, C {
          a: string;
        }
        interface B {
          b: string;
        }
        interface C {
          c: string;
        }
      `
    });
    const interphace = sourceFile.getInterfaceOrThrow("Target");
    expect(parseInterfaceDeclaration(interphace)).toStrictEqual({
      kind: TypeKind.OBJECT,
      properties: [
        {
          description: undefined,
          name: "target",
          optional: false,
          type: STRING
        },
        {
          description: undefined,
          name: "a",
          optional: false,
          type: STRING
        },
        {
          description: undefined,
          name: "b",
          optional: false,
          type: STRING
        },
        {
          description: undefined,
          name: "c",
          optional: false,
          type: STRING
        }
      ]
    });
  });
});

function createTypeNode(...types: string[]): TypeNode {
  if (types.length < 1) {
    throw new Error("at least one type required");
  }
  const content = `
    import { Integer, Date, DateTime } from "@airtasker/spot"
    import { TypeAlias } from "./alias"

    interface TestInterface {
      testProperty: ${types.join(" | ")};
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

    type TrueAlias = true;
    type AliasedCustomPrimitive = Integer;
    type ChainedAlias = AliasedCustomPrimitive;
  `;
  const sourceFile = createSourceFile(
    { path: "main", content: content },
    { path: "alias", content: `export type TypeAlias = string;` }
  );
  const interphace = sourceFile.getInterfaceOrThrow("TestInterface");
  const property = interphace.getPropertyOrThrow("testProperty");
  const typeNode = property.getTypeNodeOrThrow();

  return typeNode;
}
