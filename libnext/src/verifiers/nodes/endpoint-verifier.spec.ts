import { EndpointNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { verifyEndpointNode } from "./endpoint-verifier";

describe("endpoint node verifier", () => {
  test("valid for correct usage", () => {
    const endpointNode: EndpointNode = {
      name: {
        value: "SomeEndpoint",
        location: "somelocation.ts",
        line: 5
      },
      tags: {
        value: ["Some Tag"],
        location: "somelocation.ts",
        line: 6
      },
      method: {
        value: "POST",
        location: "somelocation.ts",
        line: 7
      },
      path: {
        value: "/a/:b/c",
        location: "somelocation.ts",
        line: 8
      },
      request: {
        value: {
          pathParams: {
            value: [
              {
                value: {
                  name: {
                    value: "b",
                    location: "somelocation.ts",
                    line: 5
                  },
                  type: {
                    kind: TypeKind.STRING
                  }
                },
                location: "somelocation.ts",
                line: 5
              }
            ],
            location: "somelocation.ts",
            line: 7
          },
          body: {
            value: {
              type: {
                kind: TypeKind.STRING
              }
            },
            location: "somelocation.ts",
            line: 11
          }
        },
        location: "somelocation.ts",
        line: 11
      },
      responses: [
        {
          value: {
            status: {
              value: 201,
              location: "somelocation.ts",
              line: 7
            }
          },
          location: "somelocation.ts",
          line: 5
        },
        {
          value: {
            status: {
              value: 400,
              location: "somelocation.ts",
              line: 7
            }
          },
          location: "somelocation.ts",
          line: 5
        }
      ]
    };
    expect(verifyEndpointNode(endpointNode, [])).toHaveLength(0);
  });
});
