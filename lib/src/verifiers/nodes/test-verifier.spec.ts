import { HttpMethod } from "../../models/http";
import {
  BodyNode,
  EndpointNode,
  PathParamNode,
  TestRequestNode
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
});
