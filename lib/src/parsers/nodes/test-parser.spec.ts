import { ClassDeclaration } from "ts-morph";
import { createSourceFile } from "../../test/helper";
import { parseTest } from "./test-parser";

describe("@test parser", () => {
  test("parses all information", () => {
    const klass = createClassDeclaration(`
      /** test description */
      @test({
        states: [{ name: "a user exists", params: { id: 101 } }],
        request: {
          headers: { "x-auth-token": "abc" },
          pathParams: { id: 101 },
          queryParams: { app: "test" },
          body: {
            test: "authy"
          }
        },
        response: {
          status: 200,
          headers: {
            Location: "/somelocation"
          },
          body: {
            testBody: "why"
          }
        }
      }, { allowInvalidRequest: true })
      testMethod() {}
    `);
    const method = klass.getMethodOrThrow("testMethod");

    expect(parseTest(method)).toStrictEqual({
      line: 5,
      location: expect.stringMatching(/main\.ts$/),
      value: {
        description: {
          line: 4,
          location: expect.stringMatching(/main\.ts$/),
          value: "test description"
        },
        options: {
          allowInvalidRequest: true
        },
        request: {
          line: 7,
          location: expect.stringMatching(/main\.ts$/),
          value: {
            body: {
              kind: "object",
              properties: [
                {
                  expression: { kind: "string-literal", value: "authy" },
                  name: "test"
                }
              ]
            },
            headers: [
              {
                expression: { kind: "string-literal", value: "abc" },
                name: '"x-auth-token"'
              }
            ],
            pathParams: [
              { expression: { kind: "number-literal", value: 101 }, name: "id" }
            ],
            queryParams: [
              {
                expression: { kind: "string-literal", value: "test" },
                name: "app"
              }
            ]
          }
        },
        response: {
          line: 15,
          location: expect.stringMatching(/main\.ts$/),
          value: {
            body: {
              kind: "object",
              properties: [
                {
                  expression: { kind: "string-literal", value: "why" },
                  name: "testBody"
                }
              ]
            },
            headers: [
              {
                expression: { kind: "string-literal", value: "/somelocation" },
                name: "Location"
              }
            ],
            status: {
              line: 16,
              location: expect.stringMatching(/main\.ts$/),
              value: 200
            }
          }
        },
        states: [
          {
            name: "a user exists",
            params: [
              { expression: { kind: "number-literal", value: 101 }, name: "id" }
            ]
          }
        ]
      }
    });
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { body, headers, test } from "@airtasker/spot"

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
