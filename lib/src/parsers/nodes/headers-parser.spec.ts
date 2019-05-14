import { MethodDeclaration } from "ts-morph";
import { FLOAT, STRING } from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseHeaders } from "./headers-parser";

describe("@headers parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      @headers
      headersParams: {
        /** auth token description */
        "x-auth-token": string;
        /** expiry description */
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("headersParams");

    expect(parseHeaders(parameter)).toStrictEqual({
      value: [
        {
          value: {
            name: {
              value: "x-auth-token",
              location: expect.stringMatching(/main\.ts$/),
              line: 8
            },
            description: {
              value: "auth token description",
              location: expect.stringMatching(/main\.ts$/),
              line: 7
            },
            type: STRING,
            optional: false
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 8
        },
        {
          value: {
            name: {
              value: "expiresIn",
              location: expect.stringMatching(/main\.ts$/),
              line: 10
            },
            description: {
              value: "expiry description",
              location: expect.stringMatching(/main\.ts$/),
              line: 9
            },
            type: FLOAT,
            optional: true
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 10
        }
      ],
      location: expect.stringMatching(/main\.ts$/),
      line: 5
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @headers
      headersParams?: {
        "x-auth-token": string;
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("headersParams");
    expect(() => parseHeaders(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { headers } from "@airtasker/spot"

    class TestClass {
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
