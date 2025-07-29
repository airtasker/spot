import nock from "nock";
import request from "supertest";
import { Contract } from "../definitions";
import { defaultConfig } from "../parsers/config-parser";
import { TypeKind } from "../types";
import { ProxyConfig, runMockServer } from "./server";

function buildProxyBaseUrl(proxyConfig: ProxyConfig): string {
  let url = `http${proxyConfig.isHttps ? "s" : ""}://`;
  url += proxyConfig.host;
  if (proxyConfig.port !== null) {
    url += `:${proxyConfig.port}`;
  }
  url += proxyConfig.path;
  return url;
}

describe("Server", () => {
  const proxyConfig: ProxyConfig = {
    isHttps: false,
    host: "localhost",
    port: 9988,
    path: ""
  };
  const proxyBaseUrl = buildProxyBaseUrl(proxyConfig);

  const fallbackProxyConfig: ProxyConfig = {
    isHttps: false,
    host: "example.com",
    port: 80,
    path: ""
  };
  const proxyFallbackBaseUrl = buildProxyBaseUrl(fallbackProxyConfig);

  const mockProxyConfig: ProxyConfig = {
    isHttps: false,
    host: "localhost",
    port: 9988,
    path: ""
  };
  const mockProxyBaseUrl = buildProxyBaseUrl(mockProxyConfig);

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

  const mockLogger = {
    log: (message: string) => message,
    error: (message: string) => message
  };

  describe("Run", () => {
    it("Proxy request and return real data if endpoint is not in a draft state", async () => {
      // Set up mock proxy server
      const proxyData = { name: "This is the real response", private: true };
      nock(proxyBaseUrl).get("/api/companies").reply(200, proxyData, {
        "Content-Type": "application/json"
      });

      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig
      });

      await request(app)
        .get("/api/companies")
        .expect(200)
        .then(response => {
          expect(response.body.name).toBe("This is the real response");
        });
    });

    it("Return mock data if endpoint is in draft state", async () => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig
      });

      await request(app)
        .post("/api/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
        });
    });

    it("Return proxied data if endpoint is in draft state and we have a mock proxy", async () => {
      // Set up mock proxy server
      const proxyData = { name: "This is a proxied response", private: true };
      nock(mockProxyBaseUrl).post("/api/companies").reply(200, proxyData, {
        "Content-Type": "application/json"
      });

      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig,
        proxyMockConfig: mockProxyConfig
      });

      await request(app)
        .post("/api/companies")
        .expect(200)
        .then(response => {
          expect(response.body.name).toBe("This is a proxied response");
        });
    });

    it("Return mock data if no proxy config is provided", async () => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085
      });

      await request(app)
        .post("/api/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
        });
    });

    it("Strip draft in request paths", async () => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyConfig
      });

      await request(app)
        .post("/api/_draft/companies")
        .expect(201)
        .then(response => {
          expect(response.body.name).not.toBe("This is the real response");
          expect(typeof response.body.name).toBe(TypeKind.STRING);
        });
    });

    it("Requests that do not match a contract return 404 without a fallback proxy", async () => {
      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085
      });

      await request(app)
        .get("/")
        .then(response => {
          expect(response.statusCode).toBe(404);
        });
    });

    it("Requests that do not match a contract to proxy the request with a fallback proxy", async () => {
      // Set up mock proxy server
      const proxyData = { name: "This is a fallback response", private: true };
      nock(proxyFallbackBaseUrl).get("/foo/bar/baz").reply(200, proxyData, {
        "Content-Type": "application/json"
      });

      const { app } = runMockServer(contract, {
        logger: mockLogger,
        pathPrefix: "/api",
        port: 8085,
        proxyFallbackConfig: fallbackProxyConfig
      });

      await request(app)
        .get("/foo/bar/baz")
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.body.name).toBe("This is a fallback response");
        });
    });
  });
});
