import { QueryParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyQueryParamNode } from "./query-param-verifier";

describe("query param node verifier", () => {
  test("valid for URL-safe type", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.STRING
      },
      optional: true
    };
    expect(verifyQueryParamNode(queryParamNode, [])).toHaveLength(0);
  });

  test("valid for URL-safe array type", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.ARRAY,
        elements: {
          kind: TypeKind.STRING
        }
      },
      optional: true
    };
    expect(verifyQueryParamNode(queryParamNode, [])).toHaveLength(0);
  });

  test("valid for URL-safe object type", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.OBJECT,
        properties: [
          {
            name: "name",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          }
        ]
      },
      optional: true
    };
    expect(verifyQueryParamNode(queryParamNode, [])).toHaveLength(0);
  });

  test("invalid for invalid name", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("so$men ame"),
      type: {
        kind: TypeKind.STRING
      },
      optional: true
    };
    const errors = verifyQueryParamNode(queryParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "query param name may only contain alphanumeric, underscore and hyphen characters"
      }
    ]);
  });

  test("invalid for URL-unsafe type", () => {
    const queryParamNode: QueryParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.NULL
      },
      optional: true
    };
    const errors = verifyQueryParamNode(queryParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "query param type may only be a URL-safe, an object, or an array of non-primitives"
      }
    ]);
  });
});
