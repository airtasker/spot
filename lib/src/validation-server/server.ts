import express from "express";

export function runValidationServer(port: number, logger: Logger) {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).end();
  });

  app.listen(port, () => {
    logger.log(`Spot validation server started at http://localhost:${port}`);
  });
}

export interface Logger {
  log(message: string): void;
}
