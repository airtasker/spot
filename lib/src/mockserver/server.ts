import cors from "cors";
import express from "express";
import { ContractDefinition } from "../models/definitions";
import { generateData } from "./dummy";
import { isRequestForEndpoint } from "./matcher";
import { proxyRequest } from "./proxy";

/**
 * Runs a mock server that returns dummy data that conforms to an API definition.
 */
export function runMockServer(
  api: ContractDefinition,
  {
    port,
    pathPrefix,
    proxyBaseUrl,
    protocol,
    logger
  }: {
    port: number;
    pathPrefix: string;
    proxyBaseUrl?: string;
    protocol: "http" | "https";
    logger: Logger;
  }
) {
  const app = express();
  app.use(cors());
  app.use((req, resp) => {
    for (const endpoint of api.endpoints) {
      if (isRequestForEndpoint(req, pathPrefix, endpoint)) {
        // non-draft end points get real response
        const shouldProxy = !endpoint.isDraft;

        if (shouldProxy && proxyBaseUrl) {
          return proxyRequest({
            incomingRequest: req,
            response: resp,
            protocol,
            proxyBaseUrl
          });
        }

        logger.log(`Request hit for ${endpoint.name} registered.`);
        const response = endpoint.responses[0] || endpoint.defaultResponse;
        if (!response) {
          logger.error(`No response defined for endpoint ${endpoint.name}`);
          return;
        }
        resp.status("status" in response ? response.status : 200);
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

export interface Logger {
  log(message: string): void;
  error(message: string): void;
}
