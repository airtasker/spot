import { ClassDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseInteraction } from "./interaction-parser";

describe("@interaction parser", () => {
  test.only("parses all information", () => {
    const klass = createClassDeclaration(`
      /** interaction description */
      @interaction({
        states: [{ name: "a user exists", params: { id: 101 } }],
        request: {
          headers: { "x-auth-token": "abc" },
          pathParams: { id: 101 },
          queryParams: { app: "test" }
        },
        response: {
          status: 200
        }
      })
      testMethod() {}
    `);
    const method = klass.getMethodOrThrow("testMethod");

    expect(parseInteraction(method)).toStrictEqual({
      line: 5,
      location: expect.stringMatching(/main\.ts$/),
      value: {
        description: {
          line: 4,
          location: expect.stringMatching(/main\.ts$/),
          value: "interaction description"
        },
        request: {
          line: 7,
          location: expect.stringMatching(/main\.ts$/),
          value: {
            body: undefined,
            headers: {},
            pathParams: {},
            queryParams: {}
          }
        },
        response: {
          line: 12,
          location: expect.stringMatching(/main\.ts$/),
          value: {
            body: undefined,
            headers: undefined,
            status: {
              line: 13,
              location: expect.stringMatching(/main\.ts$/),
              value: 200
            }
          }
        }
      }
    });
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { body, headers, interaction } from "@airtasker/spot"

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
