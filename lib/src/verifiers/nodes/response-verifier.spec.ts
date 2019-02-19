import { BodyNode, HeaderNode, ResponseNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyResponseNode } from "./response-verifier";

describe("response node verifier", () => {
  test("valid for correct usage", () => {
    const responseNode: ResponseNode = {
      status: fakeLocatable(201),
      headers: fakeLocatable([
        fakeLocatable<HeaderNode>({
          name: fakeLocatable("someheader"),
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
    expect(verifyResponseNode(responseNode, [])).toHaveLength(0);
  });
});
