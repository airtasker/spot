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
  STRING,
  stringLiteral,
  unionType
} from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { hasDiscriminator } from "./has-discriminator";

describe("rule: has-discriminator", () => {
  test("valid for correct usage", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: unionType([
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("user")
                  }
                ]),
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("admin")
                  }
                ])
              ])
            })
          }),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
              body: fakeLocatable<BodyNode>({
                type: unionType([
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("user")
                    }
                  ]),
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("admin")
                    }
                  ])
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

  test("valid for string literal unions", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "StringLiteralsUnion",
          type: unionType([stringLiteral("a"), stringLiteral("b")])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("valid for nullable objects", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "NullableObject",
          type: unionType([
            objectType([
              {
                name: "name",
                optional: false,
                type: STRING
              }
            ]),
            NULL
          ])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("valid for nullable primitives", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "NullablePrimitive",
          type: unionType([STRING, NULL])
        }
      ]
    });
    expect(errors).toEqual([]);
  });

  test("rejects missing discriminator in request", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          request: fakeLocatable<RequestNode>({
            body: fakeLocatable<BodyNode>({
              type: unionType([
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("user")
                  }
                ]),
                STRING
              ])
            })
          }),
          tests: [],
          responses: []
        })
      ],
      types: []
    });
    expect(errors).toEqual([
      {
        message:
          "The type `createUser (request body)` doesn't have a discriminator"
      }
    ]);
  });

  test("rejects missing discriminator in default response", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          tests: [],
          defaultResponse: fakeLocatable<DefaultResponseNode>({
            body: fakeLocatable<BodyNode>({
              type: unionType([
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("user")
                  }
                ]),
                STRING
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
          "The type `createUser (default response body)` doesn't have a discriminator"
      }
    ]);
  });

  test("rejects missing discriminator in specific response", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("createUser"),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/users"),
          tests: [],
          responses: [
            fakeLocatable<ResponseNode>({
              status: fakeLocatable(200),
              body: fakeLocatable<BodyNode>({
                type: unionType([
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("user")
                    }
                  ]),
                  STRING
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
          "The type `createUser (response body for status 200)` doesn't have a discriminator"
      }
    ]);
  });

  test("rejects missing discriminator nested inside array type", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "UserOrAdminList",
          type: arrayType(
            unionType([
              objectType([
                {
                  name: "type",
                  optional: false,
                  type: stringLiteral("user")
                }
              ]),
              STRING
            ])
          )
        }
      ]
    });
    expect(errors).toEqual([
      {
        message: "The type `UserOrAdminList` doesn't have a discriminator"
      }
    ]);
  });

  test("rejects missing discriminator nested inside object type", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "UserOrAdminContainer",
          type: objectType([
            {
              name: "nested",
              optional: false,
              type: unionType([
                objectType([
                  {
                    name: "type",
                    optional: false,
                    type: stringLiteral("user")
                  }
                ]),
                STRING
              ])
            }
          ])
        }
      ]
    });
    expect(errors).toEqual([
      {
        message:
          "The type `UserOrAdminContainer.nested` doesn't have a discriminator"
      }
    ]);
  });

  test("rejects missing discriminator nested inside union type", () => {
    const errors = hasDiscriminator({
      api: fakeLocatable<ApiNode>({
        name: fakeLocatable("example-api")
      }),
      endpoints: [],
      types: [
        {
          name: "UserOrAdminUnionWrapper",
          type: unionType([
            objectType([
              {
                name: "type",
                optional: false,
                type: stringLiteral("wrapper")
              },
              {
                name: "value",
                optional: false,
                type: unionType([
                  objectType([
                    {
                      name: "type",
                      optional: false,
                      type: stringLiteral("user")
                    }
                  ]),
                  STRING
                ])
              }
            ])
          ])
        }
      ]
    });
    expect(errors).toEqual([
      {
        message:
          "The type `UserOrAdminUnionWrapper[0].value` doesn't have a discriminator"
      }
    ]);
  });
});
