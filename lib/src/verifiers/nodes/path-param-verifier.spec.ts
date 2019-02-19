import { PathParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyPathParamNode } from "./path-param-verifier";

describe("path param node verifier", () => {
  test("valid for correct usage", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.STRING
      }
    };
    expect(verifyPathParamNode(pathParamNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("so$men ame"),
      type: {
        kind: TypeKind.NULL
      }
    };
    const errors = verifyPathParamNode(pathParamNode, []);
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual({
      message:
        "path param name may only contain alphanumeric, underscore and hyphen characters",
      location: "somelocation.ts",
      line: 4
    });
    expect(errors).toContainEqual({
      message: "path param type may only stem from string or number types",
      location: "somelocation.ts",
      line: 4
    });
  });
});
