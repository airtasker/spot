import { RequestNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { verifyRequestNode } from "./request-verifier";

describe("request node verifier", () => {
  test("valid for correct usage", () => {
    const requestNode: RequestNode = {
      headers: {
        value: [
          {
            value: {
              name: {
                value: "someheader",
                location: "somelocation.ts",
                line: 5
              },
              type: {
                kind: TypeKind.STRING
              },
              optional: true
            },
            location: "somelocation.ts",
            line: 5
          }
        ],
        location: "somelocation.ts",
        line: 7
      },
      pathParams: {
        value: [
          {
            value: {
              name: {
                value: "somepathparam",
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
      queryParams: {
        value: [
          {
            value: {
              name: {
                value: "somequeryparam",
                location: "somelocation.ts",
                line: 5
              },
              type: {
                kind: TypeKind.STRING
              },
              optional: true
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
    };
    expect(verifyRequestNode(requestNode, [])).toHaveLength(0);
  });
});
