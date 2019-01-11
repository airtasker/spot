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
    const result = parsePathParams(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: "company identifier description",
      name: "companyId",
      type: STRING
    });
    expect(result).toContainEqual({
      description: "user identifier description",
      name: "userId",
      type: NUMBER
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
        ${methodParameterContent}
      ) {}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow("TestClass");
  const method = klass.getMethodOrThrow("testMethod");

  return method;
}
