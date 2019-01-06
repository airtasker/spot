import { Type } from "ts-simple-ast";
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
import { TypeStore } from "./types-store";

describe("type parser", () => {
  describe("primitive types", () => {
    test("parses the null type", () => {
      const type = createType("null");

      expect(parseType(type)).toStrictEqual(NULL);
    });

    test("parses the boolean type", () => {
      const type = createType("boolean");

      expect(parseType(type)).toStrictEqual(BOOLEAN);
    });

    test("parses the string type", () => {
      const type = createType("string");

      expect(parseType(type)).toStrictEqual(STRING);
    });

    test("parses the number type", () => {
      const type = createType("number");

      expect(parseType(type)).toStrictEqual(NUMBER);
    });
  });

  describe("literal types", () => {
    test("parses literal true boolean", () => {
      const type = createType("true");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.BooleanLiteral,
        value: true
      });
    });

    test("parses literal false boolean", () => {
      const type = createType("false");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.BooleanLiteral,
        value: false
      });
    });

    test("parses literal string", () => {
      const type = createType('"myStringLiteral"');

      expect(parseType(type)).toStrictEqual({
        kind: Kind.StringLiteral,
        value: "myStringLiteral"
      });
    });

    test("parses literal integer", () => {
      const type = createType("54");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.NumberLiteral,
        value: 54
      });
    });
  });

  describe("internal custom primitive types", () => {
    test("parses Int32 type", () => {
      const type = createType("Int32");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomNumber,
        integer: true,
        min: -2147483648,
        max: 2147483647
      });
    });

    test("parses Int64 type", () => {
      const type = createType("Int64");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomNumber,
        integer: true,
        min: undefined,
        max: undefined
      });
    });

    test("parses Date type", () => {
      const type = createType("Date");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomString,
        pattern:
          "^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$"
      });
    });

    test("parses DateTime type", () => {
      const type = createType("DateTime");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomString,
        pattern:
          "^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$"
      });
    });
  });

  describe("user defined custom primitive types", () => {
    test("parses custom number type", () => {
      const type = createType("UserDefinedCustomNumber");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomNumber,
        integer: true,
        min: undefined,
        max: 4000
      });
    });

    test("parses custom string type", () => {
      const type = createType("UserDefinedCustomString");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.CustomString,
        pattern: "^[abc]{4}$"
      });
    });
  });

  describe("object types", () => {
    test("parses object literal type", () => {
      const titlePropName = "title";
      const titlePropDescription = "Some description for title";
      const yearPropName = "year";

      const type = createType(`
        { 
          /** ${titlePropDescription} */
          ${titlePropName}: string;
          
          ${yearPropName}?: number;
        }
      `);

      const result = parseType(type) as ObjectType;

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
      const type = createType("ObjectInterface");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.Reference,
        name: "ObjectInterface"
      });

      expect(TypeStore).toHaveProperty("ObjectInterface", {
        description: "Object interface description",
        type: {
          kind: Kind.Object,
          properties: [
            {
              name: "name",
              description: "Name of person",
              type: STRING,
              optional: false
            },
            {
              name: "age",
              description: "Age of person",
              type: NUMBER,
              optional: false
            }
          ],
          extends: []
        }
      });
    });

    test("parses extended object interface type", () => {
      const type = createType("ComplexInterface");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.Reference,
        name: "ComplexInterface"
      });

      expect(TypeStore).toHaveProperty("ComplexInterface", {
        description: "Complex interface description",
        type: {
          kind: Kind.Object,
          properties: [
            {
              name: "name",
              description: "Name of person",
              type: STRING,
              optional: false
            }
          ],
          extends: [
            {
              kind: Kind.Reference,
              name: "ComplexInterfaceExtension"
            }
          ]
        }
      });

      expect(TypeStore).toHaveProperty("ComplexInterfaceExtension", {
        description: undefined,
        type: {
          kind: Kind.Object,
          properties: [
            {
              name: "siblings",
              description: "Number of siblings",
              type: NUMBER,
              optional: false
            }
          ],
          extends: []
        }
      });
    });

    test("parses array type", () => {
      const type = createType("string[]");

      expect(parseType(type)).toStrictEqual({
        kind: Kind.Array,
        elements: STRING
      });
    });
  });

  describe("special types", () => {
    test("parses union types", () => {
      const type = createType("string", "number", "null");

      const result = parseType(type) as UnionType;

      expect(result.kind).toEqual(Kind.Union);
      expect(result.types).toHaveLength(3);
      expect(result.types).toContainEqual(STRING);
      expect(result.types).toContainEqual(NUMBER);
      expect(result.types).toContainEqual(NULL);
    });
  });
});

function createType(...types: string[]): Type {
  if (types.length < 1) {
    throw new Error("at least one type required");
  }
  const interfaceName = "myInterface";
  const propertyName = "myPropertyName";
  const content = `
    import { Int32, Int64, Date, DateTime, CustomStringType, CustomNumberType } from "@airtasker/spot"

    interface ${interfaceName} {
      ${propertyName}: ${types.join(" | ")};
    }

    interface UserDefinedCustomString extends CustomStringType {
      pattern: "^[abc]{4}$"
    }

    interface UserDefinedCustomNumber extends CustomNumberType {
      integer: true;
      max: 4000
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
  const sourceFile = createSourceFile({ path: "main", content: content });
  const interphace = sourceFile.getInterfaceOrThrow(interfaceName);
  const property = interphace.getPropertyOrThrow(propertyName);
  const type = property.getType();

  return type;
}
