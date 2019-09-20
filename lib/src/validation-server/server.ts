import express from "express";
import { Contract } from "../neu/definitions";

export function runValidationServer(
  port: number,
  contract: Contract,
  logger: Logger
) {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).end();
  });

  return {
    app,
    defer: () => new Promise(resolve => app.listen(port, resolve))
  };
}

export interface Logger {
  log(message: string): void;
}
