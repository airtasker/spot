import { MethodDeclaration } from "ts-simple-ast";
import { NUMBER, STRING } from "../../models/types";
import { createSourceFile } from "../../test/helper";
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
    const result = parseQueryParams(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: "name description",
      name: "name",
      type: STRING,
      optional: false
    });
    expect(result).toContainEqual({
      description: "age description",
      name: "age",
      type: NUMBER,
      optional: true
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
        ${methodParameterContent}
      ) {}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow("TestClass");
  const method = klass.getMethodOrThrow("testMethod");

  return method;
}
