import { HttpMethod } from "../../models/http";
import {
  BodyNode,
  EndpointNode,
  PathParamNode,
  TestRequestNode,
  HeaderNode
} from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyTestNode } from "./test-verifier";

describe("test node verifier", () => {
  const endpointNode: EndpointNode = {
    name: fakeLocatable("SomeEndpoint"),
    method: fakeLocatable<HttpMethod>("POST"),
    path: fakeLocatable("/company/:companyId/users"),
    request: fakeLocatable({
      headers: fakeLocatable([
        fakeLocatable<HeaderNode>({
          name: fakeLocatable("x-region"),
          type: {
            kind: TypeKind.STRING
          },
          optional: false
        })
      ]),
      pathParams: fakeLocatable([
        fakeLocatable<PathParamNode>({
          name: fakeLocatable("companyId"),
          type: {
            kind: TypeKind.STRING
          }
        })
      ]),
      body: fakeLocatable<BodyNode>({
        type: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              type: {
                kind: TypeKind.STRING
              },
              optional: false
            }
          ]
        }
      })
    }),
    responses: [
      fakeLocatable({
        status: fakeLocatable(201)
      }),
      fakeLocatable({
        status: fakeLocatable(400)
      })
    ],
    tests: []
  };

  test("valid for correct usage", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(0);
  });

  test("valid when invalid request is allowed", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [],
        pathParams: []
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: true
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(0);
  });

  test("invalid for missing header", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for unexpected header", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          },
          {
            name: "blah-header",
            expression: { kind: TypeKind.STRING_LITERAL, value: "Blah" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for malformed header", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.NUMBER_LITERAL, value: 123 }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for missing path param", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for unexpected path param", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          },
          {
            name: "userId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "who" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for malformed path param", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.NUMBER_LITERAL, value: 123 }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.STRING_LITERAL, value: "Spider" }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for missing body", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ]
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });

  test("invalid for malformed body", () => {
    const testNode = fakeLocatable({
      request: fakeLocatable<TestRequestNode>({
        headers: [
          {
            name: "x-region",
            expression: { kind: TypeKind.STRING_LITERAL, value: "AU" }
          }
        ],
        pathParams: [
          {
            name: "companyId",
            expression: { kind: TypeKind.STRING_LITERAL, value: "cave" }
          }
        ],
        body: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              name: "name",
              expression: { kind: TypeKind.NUMBER_LITERAL, value: 123 }
            }
          ]
        }
      }),
      response: fakeLocatable({
        status: fakeLocatable(201)
      }),
      options: {
        allowInvalidRequest: false
      }
    });
    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(1);
  });
});
