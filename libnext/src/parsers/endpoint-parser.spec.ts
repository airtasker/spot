import { Project, SourceFile } from "ts-simple-ast";
import { parseEndpoint } from "./endpoint-parser";

describe("@endpoint parser", () => {
  const endpointClassName = "MyEndpoint";
  const endpointDescription = "Some description";
  const endpointMethod = "PUT";
  const pathPt = {
    sC: "companies",
    dC: "companyId",
    sU: "users",
    dU: "userId"
  };
  const endpointPath = `/${pathPt.sC}/:${pathPt.dC}/${pathPt.sU}/:${pathPt.dU}`;
  const content = `
    /** ${endpointDescription} */
    @endpoint({
      method: "${endpointMethod}",
      path: "${endpointPath}"
    })
    export class ${endpointClassName} {}
  `;

  test("parses all information correctly", () => {
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
  return project.createSourceFile("spot_contract.ts", content);
}
