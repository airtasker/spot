import { SecurityHeaderNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifySecurityHeaderNode } from "./security-header-verifier";

describe("security header node verifier", () => {
  test("valid for correct usage", () => {
    const responseNode: SecurityHeaderNode = {
      name: fakeLocatable("x-auth-token"),
      type: {
        kind: TypeKind.STRING
      }
    };
    expect(verifySecurityHeaderNode(responseNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const responseNode: SecurityHeaderNode = {
      name: fakeLocatable("x-auth-token"),
      type: {
        kind: TypeKind.FLOAT
      }
    };
    const errors = verifySecurityHeaderNode(responseNode, []);
    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual({
      message: "security header type may only be a string type",
      location: "somelocation.ts",
      line: 4
    });
  });
});
