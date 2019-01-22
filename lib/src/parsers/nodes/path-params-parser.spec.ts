import { MethodDeclaration } from "ts-simple-ast";
import { NUMBER, STRING } from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parsePathParams } from "./path-params-parser";

describe("@pathParams parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      @pathParams
      testParam: {
        /** company identifier description */
        companyId: string;
        /** user identifier description */
        userId: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");

    expect(parsePathParams(parameter)).toStrictEqual({
      value: [
        {
          value: {
            name: {
              value: "companyId",
              location: expect.stringMatching(/main\.ts$/),
              line: 8
            },
            description: {
              value: "company identifier description",
              location: expect.stringMatching(/main\.ts$/),
              line: 7
            },
            type: STRING
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 8
        },
        {
          value: {
            name: {
              value: "userId",
              location: expect.stringMatching(/main\.ts$/),
              line: 10
            },
            description: {
              value: "user identifier description",
              location: expect.stringMatching(/main\.ts$/),
              line: 9
            },
            type: NUMBER
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 10
        }
      ],
      location: expect.stringMatching(/main\.ts$/),
      line: 5
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @pathParams
      testParam?: {
        companyId: string;
        userId: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");
    expect(() => parsePathParams(parameter)).toThrow();
  });

  test("fails if any object properties are optional", () => {
    const method = createMethodDeclaration(`
      @pathParams
      testParam: {
        companyId: string;
        userId?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");
    expect(() => parsePathParams(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { pathParams } from "@airtasker/spot"

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
