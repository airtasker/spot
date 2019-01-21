import { MethodDeclaration } from "ts-simple-ast";
import { NUMBER, STRING, TypeKind } from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseBody } from "./body-parser";

describe("@body parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      /** request body */
      @body bodyParam: {
        name: string;
        /** age description */
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("bodyParam");

    expect(parseBody(parameter)).toStrictEqual({
      value: {
        description: undefined,
        type: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              description: undefined,
              name: "name",
              optional: false,
              type: STRING
            },
            {
              description: "age description",
              name: "age",
              optional: true,
              type: NUMBER
            }
          ]
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 6
    });
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { body } from "@airtasker/spot"

    class TestClass {
      testMethod(
        ${methodParameterContent.trim()}
      ) {}
    }
  `;

  const sourceFile = createSourceFile({
    path: "main",
    content: content.trim()
  });
  const klass = sourceFile.getClassOrThrow("TestClass");
  const method = klass.getMethodOrThrow("testMethod");

  return method;
}
