import { createSourceFile } from "../test/helper";
import { MethodDeclaration } from "ts-simple-ast";
import { parseHeaders } from "./headers-parser";
import { STRING, NUMBER } from "../models/types";

describe("@headers parser", () => {
  const headersParamName = "paramName";

  test("parses all information", () => {
    const xAuthTokenHeaderName = '"x-auth-token"';
    const xAuthTokenHeaderDescription = "auth token";
    const expiresInHeaderName = "expiresIn";
    const expiresInHeaderDescription = "token expires in";
    const method = createMethodDeclaration(`
      @headers
      ${headersParamName}: {
        /** ${xAuthTokenHeaderDescription} */
        ${xAuthTokenHeaderName}: string;
        /** ${expiresInHeaderDescription} */
        ${expiresInHeaderName}?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(headersParamName);
    const result = parseHeaders(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: xAuthTokenHeaderDescription,
      name: xAuthTokenHeaderName,
      type: STRING,
      optional: false
    });
    expect(result).toContainEqual({
      description: expiresInHeaderDescription,
      name: expiresInHeaderName,
      type: NUMBER,
      optional: true
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @headers
      ${headersParamName}?: {
        "x-auth-token": string;
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(headersParamName);
    expect(() => parseHeaders(parameter)).toThrow();
  });

  test("fails if any object properties are invalid types", () => {
    const method = createMethodDeclaration(`
      @headers
      ${headersParamName}?: {
        "x-auth-token": {
          id: string;
          part: string;
        };
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(headersParamName);
    expect(() => parseHeaders(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const className = "MyClass";
  const methodName = "myMethod";
  const content = `
    import { headers } from "@airtasker/spot"

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
