import { TypeKind } from "../../models/types";
import { createSourceFile } from "../../spec-helpers/helper";
import { parseApi } from "./api-parser";

describe("@api parser", () => {
  test("parses all information", () => {
    const content = `
      import { api, securityHeader } from "@airtasker/spot"

      /** api description */
      @api({ name: "My API" })
      class MyApi {
        @securityHeader
        'x-auth-token'?: string;
      }
    `;
    const sourceFile = createSourceFile({
      path: "main",
      content: content.trim()
    });
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseApi(klass)).toStrictEqual({
      value: {
        name: {
          value: "My API",
          location: expect.stringMatching(/main\.ts$/),
          line: 4
        },
        description: {
          value: "api description",
          location: expect.stringMatching(/main\.ts$/),
          line: 3
        },
        securityHeader: {
          value: {
            name: {
              value: "x-auth-token",
              location: expect.stringMatching(/main\.ts$/),
              line: 7
            },
            description: undefined,
            type: {
              kind: TypeKind.STRING
            }
          },
          location: expect.stringMatching(/main\.ts$/),
          line: 6
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 4
    });
  });

  test("parses with no description", () => {
    const content = `
      import { api } from "@airtasker/spot"

      @api({ name: "My API" })
      class MyApi {}
    `;
    const sourceFile = createSourceFile({
      path: "main",
      content: content.trim()
    });
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseApi(klass)).toStrictEqual({
      value: {
        name: {
          value: "My API",
          location: expect.stringMatching(/main\.ts$/),
          line: 3
        },
        description: undefined,
        securityHeader: undefined
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 3
    });
  });
});
