import { HttpMethod } from "../../models/http";
import {
  ApiNode,
  ContractNode,
  EndpointNode,
  RequestNode
} from "../../models/nodes";
import { fakeLocatable } from "../../test/fake-locatable";
import { verifyUniqueEndpointNames } from "./endpoints";

describe("unique endpoint names verifier", () => {
  test("valid for correct usage", () => {
    const contractNode: ContractNode = {
      api: fakeLocatable({} as ApiNode),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("EndpointOne"),
          tags: fakeLocatable([]),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/a"),
          request: fakeLocatable({} as RequestNode),
          responses: [],
          tests: []
        }),
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("EndpointTwo"),
          tags: fakeLocatable([]),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/b"),
          request: fakeLocatable({} as RequestNode),
          responses: [],
          tests: []
        })
      ],
      types: []
    };
    expect(verifyUniqueEndpointNames(contractNode)).toHaveLength(0);
  });

  test("invalid for duplicate names", () => {
    const contractNode: ContractNode = {
      api: fakeLocatable({} as ApiNode),
      endpoints: [
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("EndpointOne"),
          tags: fakeLocatable([]),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/a"),
          request: fakeLocatable({} as RequestNode),
          responses: [],
          tests: []
        }),
        fakeLocatable<EndpointNode>({
          name: fakeLocatable("EndpointOne"),
          tags: fakeLocatable([]),
          method: fakeLocatable<HttpMethod>("POST"),
          path: fakeLocatable("/b"),
          request: fakeLocatable({} as RequestNode),
          responses: [],
          tests: []
        })
      ],
      types: []
    };
    expect(verifyUniqueEndpointNames(contractNode)).toMatchObject([
      {
        message: "endpoints must have unique names: EndpointOne"
      }
    ]);
  });
});
