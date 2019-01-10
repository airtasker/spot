import { ClassDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseDefaultResponse } from "./default-response-parser";

describe("@defaultResponse parser", () => {
  const methodName = "myMethod";

  test("parses all information", () => {
    const status = 201;
    const defaultResponseDescription = "This is a the default response";
    const klass = createClassDeclaration(`
      /** ${defaultResponseDescription} */
      @defaultResponse
      ${methodName}(
        @headers
        headers: {
          Location: string;
        },
        @body 
        body: {
          name: string;
        }
      ) {}
    `);
    const method = klass.getMethodOrThrow(methodName);
    const result = parseDefaultResponse(method);

    expect(result.description).toEqual(defaultResponseDescription);
    expect(result.headers).toHaveLength(1);
    expect(result.body).not.toBeUndefined;
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const className = "MyClass";
  const content = `
    import { defaultResponse, headers, body } from "@airtasker/spot"

    class ${className} {
      ${classContent}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow(className);

  return klass;
}
