import { ClassDeclaration } from "ts-simple-ast";
import { createSourceFile } from "../../test/helper";
import { parseResponse } from "./response-parser";

describe("@response parser", () => {
  const methodName = "myMethod";

  test("parses all information", () => {
    const status = 201;
    const responseDescription = "This is a valid response";
    const klass = createClassDeclaration(`
      /** ${responseDescription} */
      @response({ status: ${status} })
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
    const result = parseResponse(method);

    expect(result.description).toEqual(responseDescription);
    expect(result.status).toEqual(status);
    expect(result.headers).toHaveLength(1);
    expect(result.body).not.toBeUndefined;
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const className = "MyClass";
  const content = `
    import { response, headers, body } from "@airtasker/spot"

    class ${className} {
      ${classContent}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow(className);

  return klass;
}
