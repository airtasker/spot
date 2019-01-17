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

    // TODO: check length of array values
    expect(parseRequest(method)).toStrictEqual({
      value: {
        headers: expect.anything(),
        pathParams: expect.anything(),
        queryParams: expect.anything(),
        body: expect.anything()
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 4
    });
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
