import bodyParser from "body-parser";
import express from "express";
import http, { IncomingHttpHeaders } from "http";
import https from "https";
import { ensureBuffer } from "../../utilities/buffer";
import { Logger } from "../../utilities/logger";
import { Contract } from "../definitions";
import { ContractMismatcher } from "../validation-server/verifications/contract-mismatcher";
import { UserInputHeader } from "../validation-server/verifications/user-input-models";

export interface Host {
  scheme: "http" | "https";
  hostname: string;
  port: number;
}

export function runProxyServer(
  port: number,
  proxiedHost: Host,
  contract: Contract,
  logger: Logger
) {
  const app = express();
  app.use(bodyParser.json());

  app.use(async (req, res) => {
    const method = req.method;
    const path = req.path;
    const userInputRequest = {
      method: req.method,
      path,
      headers: extractHeaders(req.headers),
      body: req.body
    };

    const contractValidator = new ContractMismatcher(contract);
    const endpoint = contractValidator.getEndpointByRequest(userInputRequest);
    if (!endpoint) {
      throw new Error(`Received a request for unknown endpoint!`);
    }
    const requestViolations = contractValidator.findRequestViolations(
      endpoint,
      userInputRequest,
      false
    );
    if (requestViolations.length === 0) {
      // Cool, the request is valid. We can proxy it through.
      const response = await new Promise<http.IncomingMessage>(
        (resolve, reject) => {
          const requestOptions: http.RequestOptions = {
            hostname: proxiedHost.hostname,
            port: proxiedHost.port,
            method,
            path,
            headers: {
              ...req.headers,
              host: proxiedHost.hostname
            }
            // TODO: Consider adding a timeout.
          };
          const proxyRequest =
            proxiedHost.scheme === "http"
              ? http.request(requestOptions, resolve)
              : https.request(requestOptions, resolve);
          proxyRequest.on("error", reject);
          // TODO: Ideally we should have exactly the same content, or change Content-Size header.
          proxyRequest.write(JSON.stringify(req.body));
          proxyRequest.end();
        }
      );
      const statusCode = response.statusCode;
      if (!statusCode) {
        throw new Error(`No status code received!`);
      }
      const responseBody = await new Promise<Buffer>(resolve => {
        const chunks: Buffer[] = [];
        response.on("data", chunk => {
          chunks.push(ensureBuffer(chunk));
        });
        response.on("end", () => resolve(Buffer.concat(chunks)));
      });
      const responseViolations = contractValidator.findResponseViolations(
        endpoint,
        {
          statusCode,
          headers: extractHeaders(response.headers),
          body: responseBody.toString("utf8")
        },
        false
      );
      if (responseViolations.length === 0) {
        res.statusCode = statusCode;
        Object.keys(response.headers).forEach(headerName => {
          const headerValue = response.headers[headerName];
          if (headerValue) {
            res.setHeader(headerName, headerValue);
          }
        });
        res.end(responseBody);
      } else {
        // TODO: Fail (bad response).
        console.log("BAD RESPONSE!", responseViolations);
      }
    } else {
      // TODO: Fail (bad request).
      console.log("BAD REQUEST!", requestViolations);
    }
  });

  return {
    app,
    defer: () => new Promise(resolve => app.listen(port, resolve))
  };
}

function extractHeaders(headers: IncomingHttpHeaders): UserInputHeader[] {
  const userInputHeaders: UserInputHeader[] = [];
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      userInputHeaders.push({ name, value });
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          userInputHeaders.push({ name, value: item });
        } else {
          throw new Error(`Unexpected header of type ${typeof item}`);
        }
      }
    } else {
      throw new Error(`Unexpected header of type ${typeof value}`);
    }
  }
  return userInputHeaders;
}
