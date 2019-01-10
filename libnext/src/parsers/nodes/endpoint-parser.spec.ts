import { parseEndpoint } from "./endpoint-parser";
import { createSourceFile } from "../../test/helper";

describe("@endpoint parser", () => {
  const endpointClassName = "MyEndpoint";
  const endpointDescription = "Some description";
  const endpointMethod = "PUT";
  const endpointPath = "/users/:id";
  const content = `
    import { endpoint, request, response, defaultResponse, pathParams, body } from "@airtasker/spot"

    /** ${endpointDescription} */
    @endpoint({
      method: "${endpointMethod}",
      path: "${endpointPath}"
    })
    class ${endpointClassName} {
      @request
      request(
        @pathParams
        pathParams: {
          id: string;
        },
        @body body: {
          age: number;
        }
      ) {}

      @response({ status: 200 })
      successResponse() {}

      @response({ status: 400 })
      badResponse() {}

      @defaultResponse
      unexpectedResponse() {}
    }
  `;

  test("parses all information", () => {
    const sourceFile = createSourceFile({ path: "main", content: content });
    const klass = sourceFile.getClassOrThrow(endpointClassName);

    const result = parseEndpoint(klass);

    expect(result.description).toEqual(endpointDescription);
    expect(result.method).toEqual(endpointMethod);
    expect(result.name).toEqual(klass.getName());
    expect(result.path).toEqual(endpointPath);
    expect(result.request).not.toBeUndefined;
    expect(result.responses).toHaveLength(2);
    expect(result.defaultResponse).not.toBeUndefined;
  });
});
