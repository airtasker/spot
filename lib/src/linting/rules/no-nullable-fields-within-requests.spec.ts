import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  EndpointNode,
  RequestNode
} from "../../models/nodes";
import {
  INT32,
  NULL,
  objectType,
  referenceType,
  STRING,
  TypeKind,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { noNullableFieldsWithinRequests } from "./no-nullable-fields-within-requests";

describe("rule: no nullable fields within request body", () => {
  test("valid for correct usage", () => {
    const errors = noNullableFieldsWithinRequests({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with response payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: {
                kind: TypeKind.STRING
              }
            })
          }),
          responses: []
        }),
        // Endpoint with reference type in request payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: objectType([
                {
                  name: "data",
                  type: referenceType("requestBody201", "", TypeKind.OBJECT),
                  optional: false
                }
              ])
            })
          }),
          responses: []
        })
      ],
      types: [
        {
          name: "requestBody201",
          type: objectType([
            {
              name: "slug",
              type: STRING,
              optional: true
            }
          ])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects a request body object when a field is nullable instead of omittable", () => {
    const errors = noNullableFieldsWithinRequests({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with request payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: objectType([
                {
                  name: "id",
                  type: unionType([INT32, NULL]),
                  optional: false
                }
              ])
            })
          }),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (request body).id` defines an nullable property. Use omittable instead."
      }
    ]);
  });

  test("rejects a request body object when a field is nullable instead of omittable", () => {
    const errors = noNullableFieldsWithinRequests({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with request payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: objectType([
                {
                  name: "data",
                  type: objectType([
                    {
                      name: "slug",
                      type: unionType([STRING, NULL]),
                      optional: false
                    }
                  ]),
                  optional: false
                }
              ])
            })
          }),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (request body).data.slug` defines an nullable property. Use omittable instead."
      }
    ]);
  });

  test("rejects a request body object with a reference when a field is nullable instead of omittable", () => {
    const errors = noNullableFieldsWithinRequests({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with request payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: referenceType("listUserRequestBody", "", TypeKind.OBJECT)
            })
          }),
          responses: []
        })
      ],
      types: [
        {
          name: "listUserRequestBody",
          type: objectType([
            {
              name: "slug",
              type: unionType([STRING, NULL]),
              optional: true
            }
          ])
        }
      ]
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (request body).slug` defines an nullable property. Use omittable instead."
      }
    ]);
  });
});
