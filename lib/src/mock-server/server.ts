import cors from "cors";
import express from "express";
import { Contract } from "../definitions";
import { TypeTable } from "../types";
import { Logger } from "../utilities/logger";
import { generateData } from "./dummy";
import { isRequestForEndpoint } from "./matcher";
import { proxyRequest } from "./proxy";

export interface ProxyConfig {
  isHttps: boolean;
  host: string,
  path: string;
}

/**
 * Runs a mock server that returns dummy data that conforms to an API definition.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function runMockServer(
  api: Contract,
  {
    port,
    pathPrefix,
    proxyConfig,
    logger
  }: {
    port: number;
    pathPrefix: string;
    proxyConfig?: ProxyConfig | null;
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
        const shouldProxy = !endpoint.draft;

        if (shouldProxy && proxyConfig) {
          return proxyRequest({
            incomingRequest: req,
            response: resp,
            proxyConfig
          });
        }

        logger.log(`Request hit for ${endpoint.name} registered.`);
        const response = endpoint.responses[0] ?? endpoint.defaultResponse;
        if (!response) {
          logger.error(`No response defined for endpoint ${endpoint.name}`);
          return;
        }
        resp.status("status" in response ? response.status : 200);
        resp.header("content-type", "application/json");
        if (response.body) {
          resp.send(
            JSON.stringify(
              generateData(TypeTable.fromArray(api.types), response.body.type)
            )
          );
        }
        return;
      }
    }
    logger.error(`No match for request ${req.method} at ${req.path}.`);
  });
  return {
    app,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    defer: () => new Promise<void>(resolve => app.listen(port, resolve))
  };
}
