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
    expect(result).toStrictEqual({
      value: {
        headers: expect.anything(),
        pathParams: expect.anything(),
        queryParams: expect.anything(),
        body: expect.anything()
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 4
    });
    expect(result.value.headers!.value).toHaveLength(1);
    expect(result.value.pathParams!.value).toHaveLength(2);
    expect(result.value.queryParams!.value).toHaveLength(3);
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
