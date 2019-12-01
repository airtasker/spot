import nock from "nock";
import request from "supertest";
import { Contract } from "../definitions";
import { defaultConfig } from "../parsers/config-parser";
import { TypeKind } from "../types";
import { runMockServer } from "./server";

describe("Server", () => {
  const proxyBaseUrl = "http://localhost:9988";
  const protocol = "http";

  afterEach(() => {
    nock.cleanAll();
  });

  // Use inline contract to keep consistency with api definition and mock servers
  const contract: Contract = {
    name: "company-api",
    description: undefined,
    config: defaultConfig(),
    endpoints: [
      {
        name: "CreateCompany",
        description: undefined,
        draft: true,
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
        }
      },
      {
        name: "GetCompany",
        description: undefined,
        draft: false,
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
        }
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

  describe("Run", () => {
    it("Proxy request and return real data if endpoint is not in a draft state", done => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig: {
          protocol,
          proxyBaseUrl
        }
      });

      request(app)
        .get("/api/companies")
        .expect(200)
        .then(response => {
          expect(response.body.name).toBe("This is the real response");
          done();
        });
    });

    it("Return mock data if endpoint is in draft state", done => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig: {
          protocol,
          proxyBaseUrl
        }
      });

      request(app)
        .post("/api/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
          done();
        });
    });

    it("Return mock data if no proxy config is provided", done => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085
      });

      request(app)
        .post("/api/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
          done();
        });
    });

    it("Strip draft in request paths", done => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig: {
          protocol,
          proxyBaseUrl
        }
      });

      request(app)
        .post("/api/_draft/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
          done();
        });
    });
  });
});
