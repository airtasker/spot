import {
  ArrayExpression,
  BooleanExpression,
  NullExpression,
  NumberExpression,
  ObjectExpression,
  StringExpression,
  TypeKind
} from "../models/types";
import { valueFromDataExpression } from "./data-expression-utils";

describe("data expression utils", () => {
  describe("valueFromDataExpression", () => {
    it("converts null expressions to null", () => {
      const data: NullExpression = {
        kind: TypeKind.NULL
      };
      expect(valueFromDataExpression(data)).toBeNull();
    });

    it("converts boolean expressions to boolean values", () => {
      const data: BooleanExpression = {
        kind: TypeKind.BOOLEAN_LITERAL,
        value: true
      };
      expect(valueFromDataExpression(data)).toBe(true);
    });

    it("converts string expressions to string values", () => {
      const data: StringExpression = {
        kind: TypeKind.STRING_LITERAL,
        value: "hello there"
      };
      expect(valueFromDataExpression(data)).toBe("hello there");
    });

    it("converts number expressions to number values", () => {
      const data: NumberExpression = {
        kind: TypeKind.NUMBER_LITERAL,
        value: 456
      };
      expect(valueFromDataExpression(data)).toBe(456);
    });

    it("converts array expressions to array objects", () => {
      const data: ArrayExpression = {
        kind: TypeKind.ARRAY,
        elements: [
          {
            kind: TypeKind.STRING_LITERAL,
            value: "hello"
          },
          {
            kind: TypeKind.NUMBER_LITERAL,
            value: 123
          },
          {
            kind: TypeKind.BOOLEAN_LITERAL,
            value: false
          },
          {
            kind: TypeKind.NULL
          }
        ]
      };
      expect(valueFromDataExpression(data)).toStrictEqual([
        "hello",
        123,
        false,
        null
      ]);
    });

    it("converts object expressions to objects", () => {
      const data: ObjectExpression = {
        kind: TypeKind.OBJECT,
        properties: [
          {
            name: "nameA",
            expression: {
              kind: TypeKind.STRING_LITERAL,
              value: "one"
            }
          },
          {
            name: "nameB",
            expression: {
              kind: TypeKind.OBJECT,
              properties: [
                {
                  name: "nameB1",
                  expression: {
                    kind: TypeKind.NUMBER_LITERAL,
                    value: 2
                  }
                },
                {
                  name: "nameB2",
                  expression: {
                    kind: TypeKind.BOOLEAN_LITERAL,
                    value: false
                  }
                }
              ]
            }
          }
        ]
      };
      expect(valueFromDataExpression(data)).toStrictEqual({
        nameA: "one",
        nameB: {
          nameB1: 2,
          nameB2: false
        }
      });
    });
  });
});
