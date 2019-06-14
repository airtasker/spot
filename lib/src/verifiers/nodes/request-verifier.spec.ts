import {
  BodyNode,
  HeaderNode,
  PathParamNode,
  QueryParamNode,
  RequestNode
} from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { verifyRequestNode } from "./request-verifier";

describe("request node verifier", () => {
  test("valid for correct usage", () => {
    const requestNode: RequestNode = {
      headers: fakeLocatable([
        fakeLocatable<HeaderNode>({
          name: fakeLocatable("someheader"),
          type: {
            kind: TypeKind.STRING
          },
          optional: true
        })
      ]),
      pathParams: fakeLocatable([
        fakeLocatable<PathParamNode>({
          name: fakeLocatable("somepathparam"),
          type: {
            kind: TypeKind.STRING
          }
        })
      ]),
      queryParams: fakeLocatable([
        fakeLocatable<QueryParamNode>({
          name: fakeLocatable("somequeryparam"),
          type: {
            kind: TypeKind.STRING
          },
          optional: true
        })
      ]),
      body: fakeLocatable<BodyNode>({
        type: {
          kind: TypeKind.STRING
        }
      })
    };
    expect(verifyRequestNode(requestNode, [])).toHaveLength(0);
  });
});
