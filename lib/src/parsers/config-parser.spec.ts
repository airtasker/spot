import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { parseConfig } from "./config-parser";

describe("config parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/config.ts`
  ).file;

  test("parses @config decorated class", () => {
    const result = parseConfig(
      exampleFile.getClassOrThrow("ConfigClass")
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      paramSerializationStrategy: {
        query: {
          array: "comma"
        }
      }
    });
  });

  test("parses minimal @config decorated class", () => {
    const result = parseConfig(
      exampleFile.getClassOrThrow("MinimalConfigClass")
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      paramSerializationStrategy: { query: { array: "ampersand" } }
    });
  });

  test("fails to parse non-@config decorated class", () => {
    expect(() =>
      parseConfig(exampleFile.getClassOrThrow("NotConfigClass"))
    ).toThrow("Expected to find decorator named 'config'");
  });
});
