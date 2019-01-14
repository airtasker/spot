import { ClassDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseDefaultResponse } from "./default-response-parser";

describe("@defaultResponse parser", () => {
  test("parses all information", () => {
    const klass = createClassDeclaration(`
      /** Default response description */
      @defaultResponse
      methodName(
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
    const method = klass.getMethodOrThrow("methodName");
    const result = parseDefaultResponse(method);

    expect(result.description).toEqual("Default response description");
    expect(result.headers).toHaveLength(1);
    expect(result.body).not.toBeUndefined;
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { defaultResponse, headers, body } from "@airtasker/spot"

    class TestClass {
      ${classContent}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow("TestClass");

  return klass;
}
