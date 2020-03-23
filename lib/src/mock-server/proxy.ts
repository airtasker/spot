import { Request, Response } from "express";
import http from "http";
import https from "https";

export function proxyRequest({
  incomingRequest,
  response,
  protocol,
  proxyBaseUrl
}: {
  incomingRequest: Request;
  response: Response;
  protocol: "http" | "https";
  proxyBaseUrl: string;
}): void {
  const requestHandler = protocol === "http" ? http : https;

  const options = {
    headers: incomingRequest.headers,
    method: incomingRequest.method,
    path: incomingRequest.path
  };

  const proxyRequest = requestHandler.request(proxyBaseUrl, options, res => {
    // Forward headers
    response.writeHead(res.statusCode || response.statusCode, res.headers);
    res.pipe(response);
  });

  if (incomingRequest.body) {
    proxyRequest.write(incomingRequest.body);
  }

  proxyRequest.end();
}
