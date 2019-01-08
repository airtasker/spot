import { MethodDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseBody } from "./body-parser";
import { Kind, NUMBER, STRING } from "../../models/types";

describe("@body parser", () => {
  const bodyParamName = "paramName";

  test("parses all information", () => {
    const namePropertyName = "name";
    const agePropertyName = "age";
    const agePropertyDescription = "some age";
    const method = createMethodDeclaration(`
      /** request body */
      @body ${bodyParamName}?: {
        ${namePropertyName}: string;
        /** ${agePropertyDescription} */
        ${agePropertyName}?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(bodyParamName);

    expect(parseBody(parameter)).toStrictEqual({
      description: undefined,
      type: {
        kind: Kind.Object,
        properties: [
          {
            description: undefined,
            name: "name",
            optional: false,
            type: STRING
          },
          {
            description: "some age",
            name: "age",
            optional: true,
            type: NUMBER
          }
        ],
        extends: []
      },
      optional: true
    });
  });

  test("fails if the body is an invalid type", () => {
    const method = createMethodDeclaration(`
      @body ${bodyParamName}: string
    `);
    const parameter = method.getParameterOrThrow(bodyParamName);
    expect(() => parseBody(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const className = "MyClass";
  const methodName = "myMethod";
  const content = `
    import { body } from "@airtasker/spot"

    class ${className} {
      ${methodName}(
        ${methodParameterContent}
      ) {}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow(className);
  const method = klass.getMethodOrThrow(methodName);

  return method;
}
