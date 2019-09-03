import { createSourceFile } from "../../spec-helpers/helper";
import { parseConfig } from "./config-parser";

describe("@config parser", () => {
  test("parses all information", () => {
    const content = `
      import { config } from "@airtasker/spot"

      @config({
        paramSerializationStrategy: {
          query: {
            array: "comma"
          }
        }
      })
      class MyApi {}
    `;
    const sourceFile = createSourceFile({
      path: "main",
      content: content.trim()
    });
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseConfig(klass)).toStrictEqual({
      value: {
        paramSerializationStrategy: {
          query: {
            array: "comma"
          }
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 3
    });
  });
});
