import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  BodyNode,
  EndpointNode,
  ResponseNode
} from "../../models/nodes";
import {
  DataType,
  INT32,
  NULL,
  objectType,
  STRING,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { noOptionalFieldsWithinResponses } from "./no-optional-fields-within-responses";

describe("rule: no optional fields within responses", () => {
  test("valid for correct usage", () => {
    const errors = noOptionalFieldsWithinResponses({
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
        // Endpoint with nested response payload
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
            })
          ]
        })
      ],
      types: []
    });
    expect(errors).toEqual([]);
  });

  test("rejects a response object when a field is optional instead of nullable", () => {
    const errors = noOptionalFieldsWithinResponses({
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
    const errors = noOptionalFieldsWithinResponses({
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
      },
      {
        message:
          "The object type `listUsers (response body for status 201).data` defines an optional property. Use nullable instead."
      }
    ]);
  });
});
