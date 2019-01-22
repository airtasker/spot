import { ResponseNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { verifyResponseNode } from "./response-verifier";

describe("response node verifier", () => {
  test("valid for correct usage", () => {
    const responseNode: ResponseNode = {
      status: {
        value: 201,
        location: "somelocation.ts",
        line: 5
      },
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
    expect(verifyResponseNode(responseNode, [])).toHaveLength(0);
  });
});
