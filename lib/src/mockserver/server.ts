import cors from "cors";
import express from "express";
import { ContractDefinition } from "../models/definitions";
import { Logger } from "../utilities/logger";
import { generateData } from "./dummy";
import { isRequestForEndpoint } from "./matcher";
import { proxyRequest } from "./proxy";

export interface ProxyConfig {
  protocol: "http" | "https";
  proxyBaseUrl: string;
}

/**
 * Runs a mock server that returns dummy data that conforms to an API definition.
 */
export function runMockServer(
  api: ContractDefinition,
  {
    port,
    pathPrefix,
    proxyConfig,
    logger
  }: {
    port: number;
    pathPrefix: string;
    proxyConfig?: ProxyConfig;
    logger: Logger;
  }
) {
  const app = express();
  app.use(cors());
  app.use((req, resp, next) => {
    if (req.path.includes("/_draft/")) {
      req.url = req.url.replace("/_draft/", "/");
    }
    next();
  });
  app.use((req, resp) => {
    for (const endpoint of api.endpoints) {
      if (isRequestForEndpoint(req, pathPrefix, endpoint)) {
        // non-draft end points get real response
        const shouldProxy = !endpoint.isDraft;

        if (shouldProxy && proxyConfig) {
          return proxyRequest({
            incomingRequest: req,
            response: resp,
            ...proxyConfig
          });
        }

        logger.log(`Request hit for ${endpoint.name} registered.`);
        const response = endpoint.responses[0] || endpoint.defaultResponse;
        if (!response) {
          logger.error(`No response defined for endpoint ${endpoint.name}`);
          return;
        }
        resp.status("status" in response ? response.status : 200);
        resp.header("content-type", "application/json");
        if (response.body) {
          resp.send(
            JSON.stringify(generateData(api.types, response.body.type))
          );
        }
        return;
      }
    }
    logger.error(`No match for request ${req.method} at ${req.path}.`);
  });
  return {
    app,
    defer: () => new Promise(resolve => app.listen(port, resolve))
  };
}
