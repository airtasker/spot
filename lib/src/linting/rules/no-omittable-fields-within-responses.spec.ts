import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  EndpointNode,
  ResponseNode
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
import { noOmittableFieldsWithinResponses } from "./no-omittable-fields-within-responses";

describe("rule: no omittable fields within responses", () => {
  test("valid for correct usage", () => {
    const errors = noOmittableFieldsWithinResponses({
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
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: objectType([
                  {
                    name: "id",
                    type: unionType([INT32, NULL]),
                    optional: false
                  }
                ])
              })
            })
          ]
        }),
        // Endpoint with reference type in response payload
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
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
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: referenceType("responseBody201", "", TypeKind.OBJECT)
              })
            })
          ]
        })
      ],
      types: [
        {
          name: "responseBody201",
          type: objectType([
            {
              name: "slug",
              type: STRING,
              optional: false
            }
          ])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects a response object when a field is optional instead of nullable", () => {
    const errors = noOmittableFieldsWithinResponses({
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
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: objectType([
                  {
                    name: "id",
                    type: INT32,
                    optional: true
                  }
                ])
              })
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (response body for status 201)` defines an optional property. Use nullable instead."
      }
    ]);
  });

  test("rejects a nested response object when a field is optional instead of nullable", () => {
    const errors = noOmittableFieldsWithinResponses({
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
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: objectType([
                  {
                    name: "data",
                    type: objectType([
                      {
                        name: "slug",
                        type: STRING,
                        optional: true
                      }
                    ]),
                    optional: false
                  }
                ])
              })
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (response body for status 201).data` defines an optional property. Use nullable instead."
      }
    ]);
  });

  test("rejects a response object with a reference when a field is optional instead of nullable", () => {
    const errors = noOmittableFieldsWithinResponses({
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
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(201),
              body: fakeLocatable<BodyNode>({
                type: referenceType("responseBody201", "", TypeKind.OBJECT)
              })
            })
          ]
        })
      ],
      types: [
        {
          name: "responseBody201",
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
    expect(errors).toEqual([
      {
        message:
          "The object type `listUsers (response body for status 201)` defines an optional property. Use nullable instead."
      }
    ]);
  });
});
