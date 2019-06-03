import { compare } from "./compare";
import { ContractDefinition } from "../models/definitions";
import { TypeKind, STRING } from "../models/types";

describe("Contract diffing", () => {
  test("empty contracts", () => {
    const before: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [],
      types: []
    };
    const after = before;
    expect(compare(before, after)).toMatchInlineSnapshot(`
                        Object {
                          "addedEndpoints": Array [],
                          "changedEndpoints": Array [],
                          "removedEndpoints": Array [],
                        }
                `);
  });

  test("new endpoint", () => {
    const before: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [],
      types: []
    };
    const after: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [
        {
          name: "endpoint",
          method: "GET",
          path: "/users",
          tags: [],
          tests: [],
          request: {
            headers: [],
            pathParams: [],
            queryParams: []
          },
          responses: [
            {
              status: 200,
              headers: []
            }
          ]
        }
      ],
      types: []
    };
    expect(compare(before, after)).toMatchInlineSnapshot(`
                  Object {
                    "addedEndpoints": Array [
                      "endpoint",
                    ],
                    "changedEndpoints": Array [],
                    "removedEndpoints": Array [],
                  }
            `);
  });

  test("removed endpoint", () => {
    const before: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [
        {
          name: "endpoint",
          method: "GET",
          path: "/users",
          tags: [],
          tests: [],
          request: {
            headers: [],
            pathParams: [],
            queryParams: []
          },
          responses: [
            {
              status: 200,
              headers: []
            }
          ]
        }
      ],
      types: []
    };
    const after: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [],
      types: []
    };
    expect(compare(before, after)).toMatchInlineSnapshot(`
            Object {
              "addedEndpoints": Array [],
              "changedEndpoints": Array [],
              "removedEndpoints": Array [
                "endpoint",
              ],
            }
        `);
  });

  test("updated request type", () => {
    const before: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [
        {
          name: "endpoint",
          method: "POST",
          path: "/users",
          tags: [],
          tests: [],
          request: {
            headers: [],
            pathParams: [],
            queryParams: [],
            body: {
              type: {
                kind: TypeKind.OBJECT,
                properties: [
                  {
                    name: "name",
                    type: STRING,
                    optional: false
                  }
                ]
              }
            }
          },
          responses: [
            {
              status: 200,
              headers: []
            }
          ]
        }
      ],
      types: []
    };
    const after: ContractDefinition = {
      api: {
        name: "test"
      },
      endpoints: [
        {
          name: "endpoint",
          method: "POST",
          path: "/users",
          tags: [],
          tests: [],
          request: {
            headers: [],
            pathParams: [],
            queryParams: [],
            body: {
              type: {
                kind: TypeKind.OBJECT,
                properties: [
                  {
                    name: "first_name",
                    type: STRING,
                    optional: false
                  },
                  {
                    name: "last_name",
                    type: STRING,
                    optional: false
                  }
                ]
              }
            }
          },
          responses: [
            {
              status: 200,
              headers: []
            }
          ]
        }
      ],
      types: []
    };
    expect(compare(before, after)).toMatchInlineSnapshot(`
      Object {
        "addedEndpoints": Array [],
        "changedEndpoints": Array [
          Object {
            "name": "endpoint",
            "requestDiff": Object {
              "addedProperties": Array [
                "first_name",
                "last_name",
              ],
              "changedProperties": Array [],
              "kind": 0,
              "removedProperties": Array [
                "name",
              ],
            },
          },
        ],
        "removedEndpoints": Array [],
      }
    `);
  });
});
