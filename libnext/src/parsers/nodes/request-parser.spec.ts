import { MethodDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseRequest } from "./request-parser";

describe("@request parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      @headers
      headers: {
        "x-auth-token": string;
      },
      @pathParams
      pathParams: {
        id: string;
        companyId: string;
      },
      @queryParams
      queryParams: {
        search?: string;
        filter?: string;
        offset?: number;
      },
      @body 
      body: {
        name: string;
      }
    `);

    const result = parseRequest(method);

    expect(result.headers).toHaveLength(1);
    expect(result.pathParams).toHaveLength(2);
    expect(result.queryParams).toHaveLength(3);
    expect(result.body).not.toBeUndefined;
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { request, headers, pathParams, queryParams, body } from "@airtasker/spot"

    class TestClass {
      @request
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
