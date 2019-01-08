import { Project, SourceFile } from "ts-simple-ast";
import { parseApi } from "./api-parser";

describe("@api parser", () => {
  const apiClassName = "MyApi";
  const apiName = "My API";

  test("parses all information", () => {
    const apiDescription = "Some description";
    const content = `
      /** ${apiDescription} */
      @api({ name: "${apiName}" })
      class ${apiClassName} {}
    `;
    const sourceFile = constructSourceFile(content);
    const klass = sourceFile.getClassOrThrow(apiClassName);

    expect(parseApi(klass)).toStrictEqual({
      name: apiName,
      description: apiDescription
    });
  });

  test("parses with no description", () => {
    const content = `
      @api({ name: "${apiName}" })
      class ${apiClassName} {}
    `;
    const sourceFile = constructSourceFile(content);
    const klass = sourceFile.getClassOrThrow(apiClassName);

    expect(parseApi(klass)).toStrictEqual({
      name: apiName,
      description: undefined
    });
  });
});

function constructSourceFile(content: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("spot_contract_partial.ts", content);
}
