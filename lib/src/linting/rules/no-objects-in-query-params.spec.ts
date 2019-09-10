import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  QueryParamNode,
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
import { noObjectsInQueryParams } from "./no-objects-in-query-params";

describe("rule: no objects in query parameters", () => {
  test("valid for correct usage", () => {
    const errors = noObjectsInQueryParams({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with inline query parameters
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            queryParams: fakeLocatable([
              fakeLocatable<QueryParamNode>({
                name: fakeLocatable("somequeryparam"),
                type: {
                  kind: TypeKind.STRING
                },
                optional: true
              })
            ])
          }),
          responses: []
        }),
        // Endpoint with reference type in query parameters
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            queryParams: fakeLocatable([
              fakeLocatable<QueryParamNode>({
                name: fakeLocatable("somequeryparam"),
                type: referenceType("somequeryparam", "", TypeKind.UNION),
                optional: true
              })
            ])
          }),
          responses: []
        })
      ],
      types: [
        {
          name: "somequeryparam",
          type: unionType([STRING, INT32])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects query parameters of type object", () => {
    const errors = noObjectsInQueryParams({
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
            queryParams: fakeLocatable([
              fakeLocatable<QueryParamNode>({
                name: fakeLocatable("somequeryparam"),
                type: objectType([
                  {
                    name: "id",
                    type: unionType([INT32, NULL]),
                    optional: false
                  }
                ]),
                optional: true
              })
            ])
          }),
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The type `somequeryparam` in endpoint listUsers is of type object. Objects are not recommended in query parameters."
      }
    ]);
  });

  test("rejects query parameters with a reference that points to an object", () => {
    const errors = noObjectsInQueryParams({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        // Endpoint with reference type in query parameters
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("listUsers"),
          method: fakeLocatable<HttpMethod>("GET"),
          path: fakeLocatable("/users"),
          isDraft: false,
          tests: [],
          request: fakeLocatable<RequestNode>({
            queryParams: fakeLocatable([
              fakeLocatable<QueryParamNode>({
                name: fakeLocatable("somequeryparam"),
                type: referenceType("somequeryparam", "", TypeKind.OBJECT),
                optional: true
              })
            ])
          }),
          responses: []
        })
      ],
      types: [
        {
          name: "somequeryparam",
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
          "The type `somequeryparam` in endpoint listUsers is of type object. Objects are not recommended in query parameters."
      }
    ]);
  });
});
