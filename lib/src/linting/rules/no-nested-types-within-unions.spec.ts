import { ApiNode } from "../../models/nodes";
import {
  objectType,
  referenceType,
  stringLiteral,
  TypeKind,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { noNestedTypesWithinUnions } from "./no-nested-types-within-unions";

describe("rule: no-nested-types-within-unions", () => {
  test("valid for correct usage", () => {
    const errors = noNestedTypesWithinUnions({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "StringLiteralUnion",
          type: unionType([stringLiteral("a"), stringLiteral("b")])
        },
        {
          name: "ObjectUnion",
          type: unionType([
            referenceType("Type1", "", TypeKind.OBJECT),
            referenceType("Type2", "", TypeKind.OBJECT)
          ])
        },
        {
          name: "Type1",
          type: objectType([])
        },
        {
          name: "Type2",
          type: objectType([])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects nested type", () => {
    const errors = noNestedTypesWithinUnions({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "StringLiteralUnion",
          type: unionType([stringLiteral("a"), stringLiteral("b")])
        },
        {
          name: "ObjectUnion",
          type: unionType([
            referenceType("Type1", "", TypeKind.OBJECT),
            objectType([])
          ])
        },
        {
          name: "Type1",
          type: objectType([])
        }
      ]
    });
    expect(errors).toEqual([
      "The union type `ObjectUnion` defines a nested type. Use type aliases instead."
    ]);
  });
});
