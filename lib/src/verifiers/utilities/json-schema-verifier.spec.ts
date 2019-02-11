import { TypeNode } from "../../models/nodes";
import {
  ArrayExpression,
  ArrayType,
  BooleanExpression,
  BooleanLiteral,
  BooleanType,
  NullExpression,
  NullType,
  NumberExpression,
  NumberLiteral,
  NumberType,
  ObjectExpression,
  ObjectType,
  StringExpression,
  StringLiteral,
  StringType,
  TypeKind,
  UnionType
} from "../../models/types";
import { dataExpressionToJson, verifyJsonSchema } from "./json-schema-verifier";

describe("json schema verifier", () => {
  describe("dataExpressionToJson", () => {
    it("converts null expressions to null", () => {
      const data: NullExpression = {
        kind: TypeKind.NULL
      };
      expect(dataExpressionToJson(data)).toBeNull();
    });

    it("converts boolean expressions to boolean values", () => {
      const data: BooleanExpression = {
        kind: TypeKind.BOOLEAN_LITERAL,
        value: true
      };
      expect(dataExpressionToJson(data)).toBe(true);
    });

    it("converts string expressions to string values", () => {
      const data: StringExpression = {
        kind: TypeKind.STRING_LITERAL,
        value: "hello there"
      };
      expect(dataExpressionToJson(data)).toBe("hello there");
    });

    it("converts number expressions to number values", () => {
      const data: NumberExpression = {
        kind: TypeKind.NUMBER_LITERAL,
        value: 456
      };
      expect(dataExpressionToJson(data)).toBe(456);
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
      expect(dataExpressionToJson(data)).toStrictEqual([
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
      expect(dataExpressionToJson(data)).toStrictEqual({
        nameA: "one",
        nameB: {
          nameB1: 2,
          nameB2: false
        }
      });
    });
  });

  describe("verifyJsonSchema", () => {
    describe("null schema", () => {
      it("validates", () => {
        const dataType: NullType = {
          kind: TypeKind.NULL
        };
        const data: NullExpression = {
          kind: TypeKind.NULL
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: NullType = {
          kind: TypeKind.NULL
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("boolean schema", () => {
      it("validates", () => {
        const dataType: BooleanType = {
          kind: TypeKind.BOOLEAN
        };
        const data: BooleanExpression = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: true
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: BooleanType = {
          kind: TypeKind.BOOLEAN
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates literal", () => {
        const dataType: BooleanLiteral = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: false
        };
        const data: BooleanExpression = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: false
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates literal", () => {
        const dataType: BooleanLiteral = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: false
        };
        const data: BooleanExpression = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: true
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("string schema", () => {
      it("validates", () => {
        const dataType: StringType = {
          kind: TypeKind.STRING
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: StringType = {
          kind: TypeKind.STRING
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates literal", () => {
        const dataType: StringLiteral = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates literal", () => {
        const dataType: StringLiteral = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "not hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("number schema", () => {
      it("validates", () => {
        const dataType: NumberType = {
          kind: TypeKind.NUMBER
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: NumberType = {
          kind: TypeKind.NUMBER
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates literal", () => {
        const dataType: NumberLiteral = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates literal", () => {
        const dataType: NumberLiteral = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 53
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("array schema", () => {
      it("validates", () => {
        const dataType: ArrayType = {
          kind: TypeKind.ARRAY,
          elements: {
            kind: TypeKind.STRING
          }
        };
        const data: ArrayExpression = {
          kind: TypeKind.ARRAY,
          elements: [
            {
              kind: TypeKind.STRING_LITERAL,
              value: "hello"
            },
            {
              kind: TypeKind.STRING_LITERAL,
              value: "bye"
            }
          ]
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: ArrayType = {
          kind: TypeKind.ARRAY,
          elements: {
            kind: TypeKind.STRING
          }
        };
        const data: ArrayExpression = {
          kind: TypeKind.ARRAY,
          elements: [
            {
              kind: TypeKind.STRING_LITERAL,
              value: "hello"
            },
            {
              kind: TypeKind.NUMBER_LITERAL,
              value: 54
            }
          ]
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("object schema", () => {
      it("validates", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              type: {
                kind: TypeKind.STRING
              },
              optional: false
            },
            {
              name: "nameB",
              type: {
                kind: TypeKind.OBJECT,
                properties: [
                  {
                    name: "nameB1",
                    type: {
                      kind: TypeKind.BOOLEAN
                    },
                    optional: true
                  },
                  {
                    name: "nameB2",
                    type: {
                      kind: TypeKind.NUMBER_LITERAL,
                      value: 54
                    },
                    optional: false
                  }
                ]
              },
              optional: false
            }
          ]
        };
        const data: ObjectExpression = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              expression: {
                kind: TypeKind.STRING_LITERAL,
                value: "hello"
              }
            },
            {
              name: "nameB",
              expression: {
                kind: TypeKind.OBJECT,
                properties: [
                  {
                    name: "nameB2",
                    expression: {
                      kind: TypeKind.NUMBER_LITERAL,
                      value: 54
                    }
                  }
                ]
              }
            }
          ]
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates missing required attributes", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              type: {
                kind: TypeKind.STRING
              },
              optional: false
            },
            {
              name: "nameB",
              type: {
                kind: TypeKind.STRING
              },
              optional: true
            }
          ]
        };
        const data: ObjectExpression = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameB",
              expression: {
                kind: TypeKind.STRING_LITERAL,
                value: "hello"
              }
            }
          ]
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("invalidates incorrect attribute types", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              type: {
                kind: TypeKind.STRING
              },
              optional: false
            }
          ]
        };
        const data: ObjectExpression = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              expression: {
                kind: TypeKind.NUMBER_LITERAL,
                value: 54
              }
            }
          ]
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });

    describe("schemas with references", () => {
      it("validates", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              type: {
                kind: TypeKind.TYPE_REFERENCE,
                name: "UUID",
                referenceKind: TypeKind.STRING,
                location: ""
              },
              optional: false
            }
          ]
        };
        const data: ObjectExpression = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              expression: {
                kind: TypeKind.STRING_LITERAL,
                value: "someid"
              }
            }
          ]
        };
        const typeStore: TypeNode[] = [
          {
            name: "UUID",
            type: {
              kind: TypeKind.STRING
            }
          }
        ];
        expect(() => verifyJsonSchema(dataType, data, typeStore)).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              type: {
                kind: TypeKind.TYPE_REFERENCE,
                name: "UUID",
                referenceKind: TypeKind.STRING,
                location: ""
              },
              optional: false
            }
          ]
        };
        const data: ObjectExpression = {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "nameA",
              expression: {
                kind: TypeKind.NUMBER_LITERAL,
                value: 54
              }
            }
          ]
        };
        const typeStore: TypeNode[] = [
          {
            name: "UUID",
            type: {
              kind: TypeKind.STRING
            }
          }
        ];
        expect(() => verifyJsonSchema(dataType, data, typeStore)).toThrow();
      });
    });

    describe("schemas with unions", () => {
      it("validates", () => {
        const dataType: UnionType = {
          kind: TypeKind.UNION,
          types: [
            {
              kind: TypeKind.STRING
            },
            {
              kind: TypeKind.NUMBER
            }
          ]
        };
        const dataA: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        const dataB: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, dataA, [])).not.toThrow();
        expect(() => verifyJsonSchema(dataType, dataB, [])).not.toThrow();
      });

      it("invalidates", () => {
        const dataType: UnionType = {
          kind: TypeKind.UNION,
          types: [
            {
              kind: TypeKind.STRING
            },
            {
              kind: TypeKind.NUMBER
            }
          ]
        };
        const data: BooleanExpression = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: true
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });
    });
  });
});
