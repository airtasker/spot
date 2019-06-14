import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  DefaultResponseNode,
  EndpointNode,
  ResponseNode
} from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { hasResponsePayload } from "./has-response-payload";

describe("rule: has-response-payload", () => {
  test("valid for correct usage", () => {
    const errors = hasResponsePayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with default response.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          })
        }),
        // Endpoint with one successful response.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toEqual([]);
  });

  test("rejects default response with no body", () => {
    const errors = hasResponsePayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with one successful response.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [],
          defaultResponse: fakeLocatable<DefaultResponseNode>({})
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message: "default response is missing a body in endpoint listUsers"
      }
    ]);
  });

  test("rejects success response with no body", () => {
    const errors = hasResponsePayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with one successful response.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200)
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message:
          "response for status 200 is missing a body in endpoint listUsers"
      }
    ]);
  });

  test("rejects endpoint with no responses", () => {
    const errors = hasResponsePayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message: "endpoint listUsers does not declare any response"
      }
    ]);
  });

  test("rejects response without body even if other responses have bodies", () => {
    const errors = hasResponsePayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            }),
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(404)
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message:
          "response for status 404 is missing a body in endpoint listUsers"
      }
    ]);
  });
});
