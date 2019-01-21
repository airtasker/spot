import { BodyNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { verifyBodyNode } from "./body-verifier";

describe("body node verifier", () => {
  test("valid for correct usage", () => {
    const bodyNode: BodyNode = {
      type: {
        kind: TypeKind.BOOLEAN
      }
    };
    expect(verifyBodyNode(bodyNode)).toHaveLength(0);
  });
});
