import { QueryParamNode } from "../../models/nodes";
import { verifyQueryParamNode } from "./query-param-verifier";
import { TypeKind } from "../../models/types";

describe("query param node verifier", () => {
  test("valid for correct usage", () => {
    const queryParamNode: QueryParamNode = {
      name: {
        value: "somename",
        location: "somelocation.ts",
        line: 4
      },
      type: {
        kind: TypeKind.STRING
      },
      optional: true
    };
    expect(verifyQueryParamNode(queryParamNode, [])).toHaveLength(0);
  });

  test("invalid for incorrect usage", () => {
    const queryParamNode: QueryParamNode = {
      name: {
        value: "so$men ame",
        location: "somelocation.ts",
        line: 4
      },
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
