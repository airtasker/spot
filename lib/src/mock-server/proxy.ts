import { Request, Response } from "express";
import http from "http";
import https from "https";
import { ProxyConfig } from "./server";
import { normalisePath } from "./matcher";

export function proxyRequest({
  incomingRequest,
  response,
  proxyConfig
}: {
  incomingRequest: Request;
  response: Response;
  proxyConfig: ProxyConfig;
}): void {
  const requestHandler = proxyConfig.isHttps ? https : http;

  const options = {
    method: incomingRequest.method,
    host: proxyConfig.host,
    port:
      proxyConfig.port === null
        ? proxyConfig.isHttps
          ? 443
          : 80
        : proxyConfig.port,
    path: normalisePath(proxyConfig.path + incomingRequest.path),
    headers: {
      ...incomingRequest.headers,
      host: proxyConfig.host
    }
  };

  const proxyRequest = requestHandler.request(options, res => {
    // Forward headers
    response.writeHead(res.statusCode ?? response.statusCode, res.headers);
    res.pipe(response);
  });
  proxyRequest.on("error", e => {
    console.error(`Failed to proxy request: ${e}`, e.stack);
    response.statusCode = 500;
    response.send();
  });

  if (incomingRequest.body && Buffer.isBuffer(incomingRequest.body)) {
    proxyRequest.write(incomingRequest.body);
  }

  proxyRequest.end();
}
