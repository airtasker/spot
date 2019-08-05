import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  DefaultResponseNode,
  EndpointNode,
  RequestNode,
  ResponseNode
} from "../../models/nodes";
import {
  arrayType,
  NULL,
  objectType,
  referenceType,
  STRING,
  TypeKind,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { noNullableArrays } from "./no-nullable-arrays";

describe("rule: no-nullable-arrays", () => {
  test("valid for correct usage", () => {
    const errors = noNullableArrays({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "Type1",
          type: objectType([])
        },
        {
          name: "Type2",
          type: objectType([
            {
              name: "required_array",
              optional: false,
              type: arrayType(STRING)
            },
            {
              name: "optional_array",
              optional: true,
              type: arrayType(STRING)
            },
            {
              name: "reference_to_array",
              optional: true,
              type: referenceType("StringArray", "", TypeKind.ARRAY)
            }
          ])
        },
        {
          name: "StringArray",
          type: arrayType(STRING)
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects nullable array", () => {
    const errors = noNullableArrays({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: referenceType("InlinedNullableArray", "", TypeKind.UNION)
            })
          }),
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(404),
              body: fakeLocatable<BodyNode>({
                type: referenceType("InlinedNullableArray", "", TypeKind.UNION)
              })
            })
          ],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: referenceType("InlinedNullableArray", "", TypeKind.UNION)
            })
          })
        })
      ],
      types: [
        {
          name: "InlinedNullableArray",
          type: unionType([arrayType(STRING), NULL])
        },
        {
          name: "NullableReferencedArray",
          type: unionType([
            referenceType("StringArray", "", TypeKind.ARRAY),
            NULL
          ])
        },
        {
          name: "StringArray",
          type: arrayType(STRING)
        }
      ]
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `InlinedNullableArray` is a nullable array. Use an empty array to represent the absence of values instead."
      },
      {
        message:
          "The object type `NullableReferencedArray` is a nullable array. Use an empty array to represent the absence of values instead."
      },
      {
        message:
          "The object type `listUsers (default response body)` is a nullable array. Use an empty array to represent the absence of values instead."
      },
      {
        message:
          "The object type `listUsers (response body for status 404)` is a nullable array. Use an empty array to represent the absence of values instead."
      },
      {
        message:
          "The object type `listUsers (request body)` is a nullable array. Use an empty array to represent the absence of values instead."
      }
    ]);
  });
});
