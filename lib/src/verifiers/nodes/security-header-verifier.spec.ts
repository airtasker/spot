import { SecurityHeaderNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { verifySecurityHeaderNode } from "./security-header-verifier";

describe("security header node verifier", () => {
  test("valid for correct usage", () => {
    const responseNode: SecurityHeaderNode = {
      name: {
        value: "x-auth-token",
        location: "somelocation.ts",
        line: 5
      },
      type: {
        kind: TypeKind.STRING
      }
    };
    expect(verifySecurityHeaderNode(responseNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const responseNode: SecurityHeaderNode = {
      name: {
        value: "x-auth-token",
        location: "somelocation.ts",
        line: 5
      },
      type: {
        kind: TypeKind.NUMBER
      }
    };
    const errors = verifySecurityHeaderNode(responseNode, []);
    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual({
      message: "security header type may only be a string type",
      location: "somelocation.ts",
      line: 5
    });
  });
});
