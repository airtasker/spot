import { Project, SourceFile } from "ts-simple-ast";
import { parseApi } from "./api-parser";

describe("@api parser", () => {
  test("parses all information", () => {
    const content = `
      /** api description */
      @api({ name: "My API" })
      class MyApi {}
    `;
    const sourceFile = constructSourceFile(content);
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseApi(klass)).toStrictEqual({
      name: "My API",
      description: "api description"
    });
  });

  test("parses with no description", () => {
    const content = `
      @api({ name: "My API" })
      class MyApi {}
    `;
    const sourceFile = constructSourceFile(content);
    const klass = sourceFile.getClassOrThrow("MyApi");

    expect(parseApi(klass)).toStrictEqual({
      name: "My API",
      description: undefined
    });
  });
});

function constructSourceFile(content: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("spot_contract_partial.ts", content);
}
