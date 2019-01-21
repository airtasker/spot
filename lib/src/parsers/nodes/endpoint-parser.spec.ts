import { createSourceFile } from "../../test/helper";
import { parseEndpoint } from "./endpoint-parser";

describe("@endpoint parser", () => {
  const content = `
    import { endpoint, request, response, defaultResponse, pathParams, body } from "@airtasker/spot"

    /** endpoint description */
    @endpoint({
      method: "PUT",
      path: "/users/:id",
      tags: ["user"]
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
    const sourceFile = createSourceFile({
      path: "main",
      content: content.trim()
    });
    const klass = sourceFile.getClassOrThrow("TestEndpoint");

    expect(parseEndpoint(klass)).toStrictEqual({
      value: {
        description: {
          value: "endpoint description",
          location: expect.stringMatching(/main\.ts$/),
          line: 3
        },
        method: {
          value: "PUT",
          location: expect.stringMatching(/main\.ts$/),
          line: 5
        },
        name: {
          value: "TestEndpoint",
          location: expect.stringMatching(/main\.ts$/),
          line: 9
        },
        path: {
          value: "/users/:id",
          location: expect.stringMatching(/main\.ts$/),
          line: 6
        },
        tags: {
          value: ["user"],
          location: expect.stringMatching(/main\.ts$/),
          line: 7
        },
        request: {
          value: expect.anything(),
          location: expect.stringMatching(/main\.ts$/),
          line: 10
        },
        responses: expect.arrayContaining([
          {
            value: expect.anything(),
            location: expect.stringMatching(/main\.ts$/),
            line: 21
          },
          {
            value: expect.anything(),
            location: expect.stringMatching(/main\.ts$/),
            line: 24
          }
        ]),
        defaultResponse: {
          value: expect.anything(),
          location: expect.stringMatching(/main\.ts$/),
          line: 27
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 4
    });
  });
});
