import * as cors from "cors";
import * as express from "express";
import { Api } from "../models";
import { generateData } from "./dummy";
import { isRequestForEndpoint } from "./matcher";

/**
 * Runs a mock server that returns dummy data that conforms to an API definition.
 */
export function runMockServer(
  api: Api,
  {
    port,
    pathPrefix,
    logger
  }: {
    port: number;
    pathPrefix: string;
    logger: Logger;
  }
) {
  const app = express();
  app.use(cors());
  app.use((req, resp) => {
    for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
      if (isRequestForEndpoint(req, pathPrefix, endpoint)) {
        logger.log(`Request hit for ${endpointName} registered.`);
        resp.status(endpoint.successStatusCode || 200);
        resp.send(
          JSON.stringify(generateData(api.types, endpoint.responseType))
        );
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
