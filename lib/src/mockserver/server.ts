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
    logger
  }: {
    port: number;
    pathPrefix: string;
    proxyBaseUrl?: string;
    logger: Logger;
  }
) {
  const app = express();
  app.use(cors());
  app.use((req, resp) => {
    for (const endpoint of api.endpoints) {
      if (isRequestForEndpoint(req, pathPrefix, endpoint)) {
        const shouldProxy = !endpoint.isDraft;

        // non-draft end points get real response
        if (shouldProxy && proxyBaseUrl) {
          proxyRequest({
            incomingRequest: req,
            response: resp,
            pathPrefix,
            proxyBaseUrl
          });

          return;
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
  return new Promise(resolve => app.listen(port, resolve));
}

export interface Logger {
  log(message: string): void;
  error(message: string): void;
}
