import { HttpMethod } from "../../models/http";
import { BodyNode, EndpointNode, PathParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyTestNode } from "./test-verifier";

describe("test node verifier", () => {
  test("valid for correct usage", () => {
    const endpointNode: EndpointNode = {
      name: fakeLocatable("SomeEndpoint"),
      method: fakeLocatable<HttpMethod>("POST"),
      path: fakeLocatable("/a/:b/c"),
      request: fakeLocatable({
        pathParams: fakeLocatable([
          fakeLocatable<PathParamNode>({
            name: fakeLocatable("b"),
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
      tests: [
        fakeLocatable({
          request: fakeLocatable({}),
          response: fakeLocatable({
            status: fakeLocatable(201)
          }),
          options: {
            allowInvalidRequest: false
          }
        })
      ]
    };
    const testNode = endpointNode.tests[0];

    expect(verifyTestNode(testNode, endpointNode, [])).toHaveLength(0);
  });
});
