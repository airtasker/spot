import { Project, SourceFile } from "ts-simple-ast";
import { parseEndpoint } from "./endpoint-parser";

describe("@endpoint parser", () => {
  const endpointClassName = "MyEndpoint";
  const endpointDescription = "Some description";
  const endpointMethod = "PUT";
  const endpointPath = "/users/:id";
  const content = `
    /** ${endpointDescription} */
    @endpoint({
      method: "${endpointMethod}",
      path: "${endpointPath}"
    })
    class ${endpointClassName} {}
  `;

  test("parses all information", () => {
    const sourceFile = constructSourceFile(content);
    const klass = sourceFile.getClassOrThrow(endpointClassName);

    expect(parseEndpoint(klass)).toStrictEqual({
      description: endpointDescription,
      method: endpointMethod,
      path: endpointPath
    });
  });
});

function constructSourceFile(content: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("spot_contract_partial.ts", content);
}
