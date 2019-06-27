import { HttpMethod } from "../../models/http";
import { BodyNode, EndpointNode, PathParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { verifyEndpointNode } from "./endpoint-verifier";

describe("endpoint node verifier", () => {
  test("valid for correct usage", () => {
    const endpointNode: EndpointNode = {
      name: fakeLocatable("SomeEndpoint"),
      tags: fakeLocatable(["Some Tag"]),
      method: fakeLocatable<HttpMethod>("POST"),
      path: fakeLocatable("/a/:b/c"),
      isDraft: false,
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
            kind: TypeKind.STRING
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
    expect(verifyEndpointNode(endpointNode, [])).toHaveLength(0);
  });
});
