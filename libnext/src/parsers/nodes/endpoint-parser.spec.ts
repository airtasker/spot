import { createSourceFile } from "../../test/helper";
import { parseEndpoint } from "./endpoint-parser";

describe("@endpoint parser", () => {
  const content = `
    import { endpoint, request, response, defaultResponse, pathParams, body } from "@airtasker/spot"

    /** endpoint description */
    @endpoint({
      method: "PUT",
      path: "/users/:id"
    })
    class TestEndpoint {
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
    const klass = sourceFile.getClassOrThrow("TestEndpoint");

    const result = parseEndpoint(klass);

    expect(result.description).toEqual("endpoint description");
    expect(result.method).toEqual("PUT");
    expect(result.name).toEqual("TestEndpoint");
    expect(result.path).toEqual("/users/:id");
    expect(result.request).not.toBeUndefined;
    expect(result.responses).toHaveLength(2);
    expect(result.defaultResponse).not.toBeUndefined;
  });
});
