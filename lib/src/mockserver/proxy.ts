import { Request, Response } from "express";
import http from "http";
import https from "https";

export function proxyRequest({
  incomingRequest,
  response,
  pathPrefix,
  proxyBaseUrl
}: {
  incomingRequest: Request;
  response: Response;
  pathPrefix: string;
  proxyBaseUrl: string;
}) {
  const [protocol] = proxyBaseUrl.split("://");

  const requestHandler = protocol === "http" ? http : https;
  const path = `${pathPrefix}${incomingRequest.path}`;

  const options = {
    headers: incomingRequest.headers,
    method: incomingRequest.method,
    path
  };

  const proxyRequest = requestHandler.request(proxyBaseUrl, options, res => {
    res.pipe(response);
  });

  if (incomingRequest.body) {
    proxyRequest.write(incomingRequest.body);
  }

  proxyRequest.end();
}
