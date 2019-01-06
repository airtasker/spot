import { Project, SourceFile } from "ts-simple-ast";
import { parsePathParams } from "./path-params-parser";
import { STRING, NUMBER } from "../models/data-types";

describe("@pathParams parser", () => {
  const functionName = "myFunction";
  const paramName = "myPathParams";

  test("parses all information", () => {
    const content = `
      function ${functionName}(
        @pathParams
        ${paramName}: {
          /** company identifier */
          companyId: string;
          /** user identifier */
          userId: number;
        }
      ) {}
    `;

    const sourceFile = constructSourceFile(content);
    const phunction = sourceFile.getFunctionOrThrow(functionName);
    const parameter = phunction.getParameterOrThrow(paramName);

    const result = parsePathParams(parameter);

    expect(result.size).toStrictEqual(2);

    expect(result).toContainEqual({
      description: "company identifier",
      name: "companyId",
      type: STRING
    });

    expect(result).toContainEqual({
      description: "user identifier",
      name: "userId",
      type: NUMBER
    });
  });

  test("fails if the object is optional", () => {
    const content = `
      function ${functionName}(
        @pathParams
        ${paramName}?: {
          /** company identifier */
          companyId: string;
          /** user identifier */
          userId: number;
        }
      ) {}
    `;

    const sourceFile = constructSourceFile(content);
    const phunction = sourceFile.getFunctionOrThrow(functionName);
    const parameter = phunction.getParameterOrThrow(paramName);

    expect(() => parsePathParams(parameter)).toThrow();
  });
});

function constructSourceFile(content: string): SourceFile {
  const project = new Project();
  return project.createSourceFile("spot_contract_partial.ts", content);
}
