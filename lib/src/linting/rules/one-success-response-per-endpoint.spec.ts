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
import { oneSuccessResponsePerEndpoint } from "./one-success-response-per-endpoint";

describe("rule: one-success-response-per-endpoint", () => {
  test("valid for correct usage", () => {
    const errors = oneSuccessResponsePerEndpoint({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
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
              status: fakeLocatable(404),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            })
          ],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          })
        })
      ],
      types: []
    });
    expect(errors).toEqual([]);
  });

  test("rejects no successful response", () => {
    const errors = oneSuccessResponsePerEndpoint({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(404),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            })
          ],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          })
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message: "createUser does not define a successful response"
      }
    ]);
  });

  test("rejects too many successful responses", () => {
    const errors = oneSuccessResponsePerEndpoint({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
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
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            }),
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(404),
              body: fakeLocatable<BodyNode>({
                type: {
                  kind: TypeKind.STRING
                }
              })
            })
          ],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          })
        })
      ],
      types: []
    });
    expect(errors).toMatchObject([
      {
        message: "createUser defines more than one successful response"
      }
    ]);
  });
});
