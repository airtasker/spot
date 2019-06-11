import { TypeNode } from "ts-morph";
import {
  BOOLEAN,
  FLOAT,
  NULL,
  ObjectType,
  STRING,
  TypeKind,
  UnionType
} from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseInterfaceDeclaration, parseTypeNode } from "./type-parser";

describe("type node parser", () => {
  describe("primitive types", () => {
    test("parses the null type", () => {
      const typeNode = createTypeNode("null");

      expect(parseTypeNode(typeNode)).toStrictEqual(NULL);
    });

    test("parses the boolean type", () => {
      const typeNode = createTypeNode("boolean");

      expect(parseTypeNode(typeNode)).toStrictEqual(BOOLEAN);
    });

    test("parses the lowercase string type", () => {
      const typeNode = createTypeNode("string");

      expect(parseTypeNode(typeNode)).toStrictEqual(STRING);
    });

    test("parses the number type", () => {
      const typeNode = createTypeNode("number");

      expect(parseTypeNode(typeNode)).toStrictEqual(FLOAT);
    });
  });

  describe("literal types", () => {
    test("parses literal true boolean", () => {
      const typeNode = createTypeNode("true");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.BOOLEAN_LITERAL,
        value: true
      });
    });

    test("parses literal false boolean", () => {
      const typeNode = createTypeNode("false");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.BOOLEAN_LITERAL,
        value: false
      });
    });

    test("parses literal string", () => {
      const typeNode = createTypeNode('"myStringLiteral"');

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.STRING_LITERAL,
        value: "myStringLiteral"
      });
    });

    test("parses literal number", () => {
      const typeNode = createTypeNode("54");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.NUMBER_LITERAL,
        value: 54
      });
    });

    test("parses type aliased literal", () => {
      const typeNode = createTypeNode("TrueAlias");
      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.BOOLEAN_LITERAL,
        name: "TrueAlias",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });

  describe("internal custom primitive types", () => {
    test("parses Float type", () => {
      const typeNode = createTypeNode("Float");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.FLOAT
      });
    });

    test("parses Integer type", () => {
      const typeNode = createTypeNode("Integer");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.INT32
      });
    });

    test("parses Int32 type", () => {
      const typeNode = createTypeNode("Int32");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.INT32
      });
    });

    test("parses Integer type", () => {
      const typeNode = createTypeNode("Int64");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.INT64
      });
    });

    test("parses Date type", () => {
      const typeNode = createTypeNode("Date");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.DATE
      });
    });

    test("parses DateTime type", () => {
      const typeNode = createTypeNode("DateTime");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.DATE_TIME
      });
    });

    test("parses String type", () => {
      const typeNode = createTypeNode("String");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.STRING
      });
    });

    test("identifies that the String type has not been imported", () => {
      const content = `
        interface TestInterface {
          testProperty: String;
        }
      `;
      const sourceFile = createSourceFile({ path: "main", content });
      const interphace = sourceFile.getInterfaceOrThrow("TestInterface");
      const property = interphace.getPropertyOrThrow("testProperty");
      const typeNode = property.getTypeNodeOrThrow();

      expect(() => parseTypeNode(typeNode)).toThrowError(
        'expected exactly one declaration for String\nDid you forget to import String? => import { String } from "@airtasker/spot"'
      );
    });

    test("parses aliased custom primitive", () => {
      const typeNode = createTypeNode("AliasedCustomPrimitive");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.INT32,
        name: "AliasedCustomPrimitive",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });

  describe("external custom primitive types", () => {
    test("parses custom string", () => {
      const typeNode = createTypeNode("TypeAlias");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.STRING,
        name: "TypeAlias",
        location: expect.stringMatching(/alias\.ts$/)
      });
    });
  });

  describe("object types", () => {
    test("parses object literal type", () => {
      const typeNode = createTypeNode(`
        {
          /** Some description for title */
          title: string;
          year?: number;
        }
      `);

      const result = parseTypeNode(typeNode) as ObjectType;

      expect(result.kind).toEqual(TypeKind.OBJECT);
      expect(result.properties).toHaveLength(2);
      expect(result.properties).toContainEqual({
        name: "title",
        description: "Some description for title",
        type: STRING,
        optional: false
      });
      expect(result.properties).toContainEqual({
        name: "year",
        description: undefined,
        type: FLOAT,
        optional: true
      });
    });

    test("parses object literal type", () => {
      const typeNode = createTypeNode("ObjectLiteralType");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.OBJECT,
        name: "ObjectLiteralType",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses object interface type", () => {
      const typeNode = createTypeNode("ObjectInterface");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.OBJECT,
        name: "ObjectInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses extended object interface type", () => {
      const typeNode = createTypeNode("ComplexInterface");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.OBJECT,
        name: "ComplexInterface",
        location: expect.stringMatching(/main\.ts$/)
      });
    });

    test("parses array type", () => {
      const typeNode = createTypeNode("string[]");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.ARRAY,
        elements: STRING
      });
    });
  });

  describe("special types", () => {
    test("parses union types", () => {
      const typeNode = createTypeNode("string", "number", "null");

      const result = parseTypeNode(typeNode) as UnionType;

      expect(result.kind).toEqual(TypeKind.UNION);
      expect(result.types).toHaveLength(3);
      expect(result.types).toContainEqual(STRING);
      expect(result.types).toContainEqual(FLOAT);
      expect(result.types).toContainEqual(NULL);
    });

    test("parses chained type alias", () => {
      const typeNode = createTypeNode("ChainedAlias");

      expect(parseTypeNode(typeNode)).toStrictEqual({
        kind: TypeKind.TYPE_REFERENCE,
        referenceKind: TypeKind.TYPE_REFERENCE,
        name: "ChainedAlias",
        location: expect.stringMatching(/main\.ts$/)
      });
    });
  });
});

describe("enum types", () => {
  test("throws a helpful error when encountering an enum type", () => {
    const typeNode = createTypeNode("TestEnum");
    expect(() => parseTypeNode(typeNode)).toThrow(
      "enums are not supported (offending type: TestEnum)"
    );
  });

  test("throws a helpful error when encountering an enum constant", () => {
    const typeNode = createTypeNode("TestEnum.A");
    expect(() => parseTypeNode(typeNode)).toThrow(
      "enums are not supported (offending type: TestEnum)"
    );
  });
});

describe("map types", () => {
  test("throws a helpful error when encountering an ES6 map type", () => {
    const typeNode = createTypeNode("TestMap");
    expect(() => parseTypeNode(typeNode)).toThrow("Map is not supported");
  });
});

describe("indexed types", () => {
  test("throws a helpful error when encountering a dictionary interface", () => {
    const typeNode = createTypeNode("TestDictionaryInterface");
    expect(() => parseTypeNode(typeNode)).toThrow(
      "indexed types are not supported (offending type: TestDictionaryInterface)"
    );
  });

  test("throws a helpful error when encountering a dictionary type", () => {
    const typeNode = createTypeNode("TestDictionaryType");
    expect(() => parseTypeNode(typeNode)).toThrow(
      "indexed types are not supported (offending type: TestDictionaryType)"
    );
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
    import { Float, Integer, Int32, Int64, String, Date, DateTime } from "@airtasker/spot"
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

    type ObjectLiteralType = {
      name: string;
    }

    enum TestEnum {
      A,
      B,
      C
    }

    type TestMap = Map<string, Integer>;

    interface TestDictionaryInterface {
      [key: string]: Integer;
    }

    type TestDictionaryType = {
      [key: string]: Integer;
    }

    type TrueAlias = true;
    type AliasedCustomPrimitive = Integer;
    type ChainedAlias = AliasedCustomPrimitive;
  `;
  const sourceFile = createSourceFile(
    { path: "main", content },
    { path: "alias", content: `export type TypeAlias = string;` }
  );
  const interphace = sourceFile.getInterfaceOrThrow("TestInterface");
  const property = interphace.getPropertyOrThrow("testProperty");
  const typeNode = property.getTypeNodeOrThrow();

  return typeNode;
}
