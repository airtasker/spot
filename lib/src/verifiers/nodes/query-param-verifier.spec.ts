import { QueryParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyQueryParamNode } from "./query-param-verifier";

describe("query param node verifier", () => {
  test("valid for correct usage", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.STRING
      },
      optional: true
    };
    expect(verifyQueryParamNode(queryParamNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("so$men ame"),
      type: {
        kind: TypeKind.NULL
      },
      optional: true
    };
    const errors = verifyQueryParamNode(queryParamNode, []);
    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual({
      message:
        "query param name may only contain alphanumeric, underscore and hyphen characters",
      location: "somelocation.ts",
      line: 4
    });
    expect(errors).toContainEqual({
      message: "query param type may only stem from string or number types",
      location: "somelocation.ts",
      line: 4
    });
  });
});
