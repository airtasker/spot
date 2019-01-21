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

    expect(parseResponse(method)).toStrictEqual({
      value: {
        status: {
          value: 201,
          location: expect.stringMatching(/main\.ts$/),
          line: 5
        },
        description: {
          value: "response description",
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
    import { response, headers, body } from "@airtasker/spot"

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
