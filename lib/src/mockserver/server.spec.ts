import nock from "nock";
import request from "supertest";
import { ContractDefinition } from "../models/definitions";
import { TypeKind } from "../models/types";
import { runMockServer } from "./server";

describe("Server", () => {
  const proxyBaseUrl = "http://localhost:9988";
  const protocol = "http";

  afterEach(() => {
    nock.cleanAll();
  });

  // Use inline contract to keep consistency with api definition and mock servers
  const contract: ContractDefinition = {
    api: {
      name: "company-api",
      description: undefined,
      securityHeader: undefined
    },
    endpoints: [
      {
        name: "CreateCompany",
        description: undefined,
        isDraft: true,
        tags: [],
        method: "POST",
        path: "/companies",
        request: {
          queryParams: [],
          pathParams: [],
          headers: []
        },
        responses: [
          {
            status: 201,
            headers: [],
            body: {
              type: {
                kind: TypeKind.OBJECT,
                properties: [
                  {
                    name: "name",
                    type: { kind: TypeKind.STRING },
                    optional: false
                  }
                ]
              }
            }
          }
        ],
        defaultResponse: {
          headers: []
        },
        tests: []
      },
      {
        name: "GetCompany",
        description: undefined,
        isDraft: false,
        tags: [],
        method: "GET",
        path: "/companies",
        request: {
          queryParams: [],
          pathParams: [],
          headers: []
        },
        responses: [{ status: 200, headers: [] }],
        defaultResponse: {
          headers: []
        },
        tests: []
      }
    ],
    types: []
  };

  const data = { name: "This is the real response", private: true };

  // Set up mock proxy server
  nock(proxyBaseUrl)
    .get("/api/companies")
    .reply(200, data, {
      "Content-Type": "application/json"
    });

  const mockLogger = {
    log: (message: string) => message,
    error: (message: string) => message
  };

  const { app } = runMockServer(contract, {
    logger: mockLogger,
    pathPrefix: "/api",
    port: 8085,
    proxyConfig: {
      protocol,
      proxyBaseUrl,
    }
  });

  describe("Run", () => {
    it("Proxy request and return real data if endpoint is not in a draft state", done => {
      request(app)
        .get("/api/companies")
        .expect(200)
        .then(response => {
          expect(response.body.name).toBe("This is the real response");
          done();
        });
    });

    it("Return mock data if endpoint is in draft state", done => {
      request(app)
        .post("/api/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          done();
        });
    });
  });
});
