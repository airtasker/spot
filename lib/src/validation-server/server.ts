import express from "express";

export function startValidationServer(port: number) {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).end();
  });

  app.listen(port, () => {
    console.log(`Spot validation server started at http://localhost:${port}`);
  });
}
