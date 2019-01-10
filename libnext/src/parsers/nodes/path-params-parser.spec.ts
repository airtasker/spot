import { parsePathParams } from "./path-params-parser";
import { createSourceFile } from "../../test/helper";
import { STRING, NUMBER } from "../../models/types";
import { MethodDeclaration } from "ts-simple-ast";

describe("@pathParams parser", () => {
  const pathParamName = "paramName";

  test("parses all information", () => {
    const companyIdPropName = "companyId";
    const companyIdPropDescription = "company identifier";
    const userIdPropName = "userId";
    const userIdPropDescription = "user identifier";
    const method = createMethodDeclaration(`
      @pathParams
      ${pathParamName}: {
        /** ${companyIdPropDescription} */
        ${companyIdPropName}: string;
        /** ${userIdPropDescription} */
        ${userIdPropName}: number;
      }
    `);

    const parameter = method.getParameterOrThrow(pathParamName);
    const result = parsePathParams(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: companyIdPropDescription,
      name: companyIdPropName,
      type: STRING
    });
    expect(result).toContainEqual({
      description: userIdPropDescription,
      name: userIdPropName,
      type: NUMBER
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @pathParams
      ${pathParamName}?: {
        companyId: string;
        userId: number;
      }
    `);

    const parameter = method.getParameterOrThrow(pathParamName);
    expect(() => parsePathParams(parameter)).toThrow();
  });

  test("fails if any object properties are optional", () => {
    const method = createMethodDeclaration(`
      @pathParams
      ${pathParamName}: {
        companyId: string;
        userId?: number;
      }
    `);

    const parameter = method.getParameterOrThrow(pathParamName);
    expect(() => parsePathParams(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const className = "MyClass";
  const methodName = "myMethod";
  const content = `
    import { pathParams } from "@airtasker/spot"

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
