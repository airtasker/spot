import { Expression } from "ts-simple-ast";
import { NULL, TypeKind } from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseExpression } from "./expression-parser";

describe("type expression parser", () => {
  test("parses the null expression", () => {
    const expression = createExpression("null");

    expect(parseExpression(expression)).toStrictEqual(NULL);
  });

  test("parses the true boolean expression", () => {
    const expression = createExpression("true");

    expect(parseExpression(expression)).toStrictEqual({
      kind: TypeKind.BOOLEAN_LITERAL,
      value: true
    });
  });

  test("parses the false boolean expression", () => {
    const expression = createExpression("false");

    expect(parseExpression(expression)).toStrictEqual({
      kind: TypeKind.BOOLEAN_LITERAL,
      value: false
    });
  });

  test("parses a string expression", () => {
    const expression = createExpression('"string"');

    expect(parseExpression(expression)).toStrictEqual({
      kind: TypeKind.STRING_LITERAL,
      value: "string"
    });
  });

  test("parses a number expression", () => {
    const expression = createExpression("5.34");

    expect(parseExpression(expression)).toStrictEqual({
      kind: TypeKind.NUMBER_LITERAL,
      value: 5.34
    });
  });

  test("parses an array expression", () => {
    const expression = createExpression(
      `[1, "string", true, { myobject: 3 }, null]`
    );

    expect(parseExpression(expression)).toStrictEqual({
      elements: [
        { kind: "number-literal", value: 1 },
        { kind: "string-literal", value: "string" },
        { kind: "boolean-literal", value: true },
        {
          kind: "object",
          properties: [
            {
              expression: { kind: "number-literal", value: 3 },
              name: "myobject"
            }
          ]
        },
        { kind: "null" }
      ],
      kind: "array"
    });
  });

  test("parses an object literal expression", () => {
    const expression = createExpression(`
      { 
        title: "mytitle",
        year: 1999
      }
    `);

    expect(parseExpression(expression)).toStrictEqual({
      kind: "object",
      properties: [
        {
          name: "title",
          expression: { kind: "string-literal", value: "mytitle" }
        },
        {
          name: "year",
          expression: { kind: "number-literal", value: 1999 }
        }
      ]
    });
  });
});

function createExpression(literal: string): Expression {
  const content = `const testVar = ${literal.trim()};`;
  const sourceFile = createSourceFile({ path: "main", content: content });
  const variable = sourceFile.getVariableDeclarationOrThrow("testVar");
  const expression = variable.getInitializerOrThrow();

  return expression;
}
