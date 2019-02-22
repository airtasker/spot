import { PathParamNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyPathParamNode } from "./path-param-verifier";

describe("path param node verifier", () => {
  test("valid for URL-safe type", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.STRING
      }
    };
    expect(verifyPathParamNode(pathParamNode, [])).toHaveLength(0);
  });

  test("valid for URL-safe array type", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.ARRAY,
        elements: {
          kind: TypeKind.STRING
        }
      }
    };
    expect(verifyPathParamNode(pathParamNode, [])).toHaveLength(0);
  });

  test("invalid for invalid name", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("so$men ame"),
      type: {
        kind: TypeKind.STRING
      }
    };
    const errors = verifyPathParamNode(pathParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "path param name may only contain alphanumeric, underscore and hyphen characters"
      }
    ]);
  });

  test("invalid for URL-unsafe type", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.NULL
      }
    };
    const errors = verifyPathParamNode(pathParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "path param type may only be a URL-safe type or an array of URL-safe types"
      }
    ]);
  });

  test("invalid for URL-unsafe array type", () => {
    const pathParamNode: PathParamNode = {
      name: fakeLocatable("somename"),
      type: {
        kind: TypeKind.ARRAY,
        elements: {
          kind: TypeKind.NULL
        }
      }
    };
    const errors = verifyPathParamNode(pathParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "path param type may only be a URL-safe type or an array of URL-safe types"
      }
    ]);
  });

  test("invalid for objects", () => {
    const pathParamNode: PathParamNode = {
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
      }
    };
    const errors = verifyPathParamNode(pathParamNode, []);
    expect(errors).toMatchObject([
      {
        message:
          "path param type may only be a URL-safe type or an array of URL-safe types"
      }
    ]);
  });
});
