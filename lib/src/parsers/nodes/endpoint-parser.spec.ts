import { ClassDeclaration } from "ts-morph";
import { createSourceFile } from "../../spec-helpers/helper";
import { parseEndpoint } from "./endpoint-parser";

describe("@endpoint parser", () => {
  test("parses all information", () => {
    const content = `
    import { endpoint, request, response, defaultResponse, pathParams, body, test } from "@airtasker/spot"

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

      @test({
        states: [{ name: "a user exists", params: { id: "abc" } }],
        request: {
          pathParams: {
            id: "abc"
          },
          body: {
            age: 45
          }
        },
        response: {
          status: 200
        }
      })
      successResponseTest() {}
    }
  `;

    const klass = getClassDeclaration(content, "TestEndpoint");

    expect(parseEndpoint(klass)).toStrictEqual({
      value: {
        isDraft: false,
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
        },
        tests: expect.arrayContaining([
          {
            value: expect.anything(),
            location: expect.stringMatching(/main\.ts$/),
            line: 30
          }
        ])
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 4
    });
  });

  test("parses draft decorator", () => {
    const content = `
    import { endpoint, response, draft } from "@airtasker/spot"

    @draft
    @endpoint({
      method: "GET",
      path: "/users"
    })
    class DraftEndpoint {
      @response({ status: 200 })
      successResponse() {}
    }
  `;

    const klass = getClassDeclaration(content, "DraftEndpoint");
    const parsedEndpoint = parseEndpoint(klass);

    expect(parsedEndpoint).toHaveProperty("value.isDraft");
    expect(parsedEndpoint).toMatchObject({
      value: {
        isDraft: true
      }
    });
  });
});

function getClassDeclaration(
  content: string,
  endpointClassName: string
): ClassDeclaration {
  const sourceFile = createSourceFile({
    path: "main",
    content: content.trim()
  });
  return sourceFile.getClassOrThrow(endpointClassName);
}
