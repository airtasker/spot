import { ClassDeclaration } from "ts-morph";
import { createSourceFile } from "../../spec-helpers/helper";
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

    expect(parseDefaultResponse(method)).toStrictEqual({
      value: {
        description: {
          value: "Default response description",
          location: expect.stringMatching(/main\.ts$/),
          line: 4
        },
        headers: {
          value: expect.anything(),
          location: expect.stringMatching(/main\.ts$/),
          line: 7
        },
        body: {
          value: expect.anything(),
          location: expect.stringMatching(/main\.ts$/),
          line: 11
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 5
    });
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { defaultResponse, headers, body } from "@airtasker/spot"

    class TestClass {
      ${classContent.trim()}
    }
  `;

  const sourceFile = createSourceFile({
    path: "main",
    content: content.trim()
  });
  const klass = sourceFile.getClassOrThrow("TestClass");

  return klass;
}
