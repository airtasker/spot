import { createSourceFile } from "../test/helper";
import { MethodDeclaration } from "ts-simple-ast";
import { parseQueryParams } from "./query-params-parser";
import { STRING, NUMBER } from "../models/types";

describe("@queryParams parser", () => {
  const queryParamName = "paramName";

  test("parses all information", () => {
    const namePropName = "name";
    const namePropDescription = "name of person";
    const agePropName = "age";
    const agePropDescription = "age of person";
    const method = createMethodDeclaration(`
      @queryParams
      ${queryParamName}: {
        /** ${namePropDescription} */
        ${namePropName}: string;
        /** ${agePropDescription} */
        ${agePropName}?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(queryParamName);
    const result = parseQueryParams(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: namePropDescription,
      name: namePropName,
      type: STRING,
      optional: false
    });
    expect(result).toContainEqual({
      description: agePropDescription,
      name: agePropName,
      type: NUMBER,
      optional: true
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @queryParams
      ${queryParamName}?: {
        name: string;
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(queryParamName);
    expect(() => parseQueryParams(parameter)).toThrow();
  });

  test("fails if any object properties are invalid types", () => {
    const method = createMethodDeclaration(`
      @queryParams
      ${queryParamName}?: {
        name: {
          firstName: string;
          lastName: string;
        };
        age?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(queryParamName);
    expect(() => parseQueryParams(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const className = "MyClass";
  const methodName = "myMethod";
  const content = `
    import { queryParams } from "@airtasker/spot"

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
