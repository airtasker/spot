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
import { verifyJsonSchema } from "./json-schema-verifier";

describe("json schema verifier", () => {
  describe("verifyJsonSchema", () => {
    describe("null schema", () => {
      it("validates null expression", () => {
        const dataType: NullType = {
          kind: TypeKind.NULL
        };
        const data: NullExpression = {
          kind: TypeKind.NULL
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates non null expression", () => {
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
      it("validates boolean expression", () => {
        const dataType: BooleanType = {
          kind: TypeKind.BOOLEAN
        };
        const data: BooleanExpression = {
          kind: TypeKind.BOOLEAN_LITERAL,
          value: true
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates non boolean expression", () => {
        const dataType: BooleanType = {
          kind: TypeKind.BOOLEAN
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates matching boolean literal", () => {
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

      it("invalidates non matching boolean literal", () => {
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
      it("validates string expression", () => {
        const dataType: StringType = {
          kind: TypeKind.STRING
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates non string expression", () => {
        const dataType: StringType = {
          kind: TypeKind.STRING
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates matching string literal", () => {
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

      it("invalidates non matching string literal", () => {
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
      it("validates number expression", () => {
        const dataType: NumberType = {
          kind: TypeKind.NUMBER
        };
        const data: NumberExpression = {
          kind: TypeKind.NUMBER_LITERAL,
          value: 54
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates number expression", () => {
        const dataType: NumberType = {
          kind: TypeKind.NUMBER
        };
        const data: StringExpression = {
          kind: TypeKind.STRING_LITERAL,
          value: "hello"
        };
        expect(() => verifyJsonSchema(dataType, data, [])).toThrow();
      });

      it("validates matching number literal", () => {
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

      it("invalidates non matching number literal", () => {
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
      it("validates array expression", () => {
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

      it("validates an empty array expression", () => {
        const dataType: ArrayType = {
          kind: TypeKind.ARRAY,
          elements: {
            kind: TypeKind.NUMBER
          }
        };
        const data: ArrayExpression = {
          kind: TypeKind.ARRAY,
          elements: []
        };
        expect(() => verifyJsonSchema(dataType, data, [])).not.toThrow();
      });

      it("invalidates non array expression", () => {
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
      it("validates object expression", () => {
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

      it("validates object with extra attributes", () => {
        const dataType: ObjectType = {
          kind: TypeKind.OBJECT,
          properties: []
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
      it("validates object with reference expressions", () => {
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

      it("invalidates if referenced expressions do not exist", () => {
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
      it("validates any expression matching the union", () => {
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

      it("invalidates an expression that does not match the union", () => {
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
