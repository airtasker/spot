import { ClassDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseResponse } from "./response-parser";

describe("@response parser", () => {
  test("parses all information", () => {
    const klass = createClassDeclaration(`
      /** response description */
      @response({ status: 201 })
      testMethod(
        @headers
        headers: {
          Location: string;
        },
        @body 
        body: {
          name: string;
        }
      ) {}
    `);
    const method = klass.getMethodOrThrow("testMethod");
    const result = parseResponse(method);

    expect(result.description).toEqual("response description");
    expect(result.status).toEqual(201);
    expect(result.headers).toHaveLength(1);
    expect(result.body).not.toBeUndefined;
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { response, headers, body } from "@airtasker/spot"

    class TestClass {
      ${classContent}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow("TestClass");

  return klass;
}
