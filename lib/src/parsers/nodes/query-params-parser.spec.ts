import { MethodDeclaration } from "ts-morph";
import { FLOAT, STRING } from "../../models/types";
import { createSourceFile } from "../../spec-helpers/helper";
import { parseQueryParams } from "./query-params-parser";

describe("@queryParams parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      @queryParams
      testParam: {
        /** name description */
        name: string;
        /** age description */
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");

    expect(parseQueryParams(parameter)).toStrictEqual({
      value: [
        {
          value: {
            name: {
              value: "name",
              location: expect.stringMatching(/main\.ts$/),
              line: 8
            },
            description: {
              value: "name description",
              location: expect.stringMatching(/main\.ts$/),
              line: 7
            },
            type: STRING,
            optional: false
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 8
        },
        {
          value: {
            name: {
              value: "age",
              location: expect.stringMatching(/main\.ts$/),
              line: 10
            },
            description: {
              value: "age description",
              location: expect.stringMatching(/main\.ts$/),
              line: 9
            },
            type: FLOAT,
            optional: true
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
      @queryParams
      testParam?: {
        name: string;
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");
    expect(() => parseQueryParams(parameter)).toThrow();
  });

  test("fails if any object properties are invalid types", () => {
    const method = createMethodDeclaration(`
      @queryParams
      testParam?: {
        name: {
          firstName: string;
          lastName: string;
        };
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("testParam");
    expect(() => parseQueryParams(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { queryParams } from "@airtasker/spot"

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
