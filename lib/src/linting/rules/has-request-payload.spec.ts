import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  EndpointNode,
  PathParamNode,
  RequestNode
} from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { hasRequestPayload } from "./has-request-payload";

describe("rule: has-request-payload", () => {
  test("valid for correct usage", () => {
    const errors = hasRequestPayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // GET endpoint with no request parameters at all.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: []
        }),
        // GET endpoint with a request path parameter but no body.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("getUser"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users/:userId"),
          tests: [],
          request: fakeLocatable<RequestNode>({
            pathParams: fakeLocatable([
              fakeLocatable<PathParamNode>({
                name: fakeLocatable("userId"),
                type: {
                  kind: TypeKind.STRING
                }
              })
            ])
          }),
          responses: []
        }),
        // POST endpoint with a request body.
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          }),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toEqual([]);
  });

  test("rejects GET endpoint with a request body", () => {
    const errors = hasRequestPayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          }),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message:
          "createUser should not have a request payload as its method is GET"
      }
    ]);
  });

  test("rejects POST endpoint without a request", () => {
    const errors = hasRequestPayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message:
          "createUser should have a request payload as its method is POST"
      }
    ]);
  });

  test("rejects POST endpoint without a request body", () => {
    const errors = hasRequestPayload({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          tests: [],
          request: fakeLocatable<RequestNode>({}),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message:
          "createUser should have a request payload as its method is POST"
      }
    ]);
  });
});
