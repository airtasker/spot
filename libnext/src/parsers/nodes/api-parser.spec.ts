import { createSourceFile } from "../../test/helper";
import { parseApi } from "./api-parser";

describe("@api parser", () => {
  test("parses all information", () => {
    const content = `
      import { api } from "@airtasker/spot"

      /** api description */
      @api({ name: "My API" })
      class MyApi {}
    `;
    const sourceFile = createSourceFile({
      path: "main",
      content: content.trim()
    });
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseApi(klass)).toStrictEqual({
      name: {
        value: "My API",
        location: expect.stringMatching(/main\.ts$/),
        line: 4
      },
      description: {
        value: "api description",
        location: expect.stringMatching(/main\.ts$/),
        line: 3
      }
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
      name: {
        value: "My API",
        location: expect.stringMatching(/main\.ts$/),
        line: 3
      },
      description: undefined
    });
  });
});
