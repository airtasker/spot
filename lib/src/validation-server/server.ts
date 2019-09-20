import express from "express";

export function runValidationServer(port: number, logger: Logger) {
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
