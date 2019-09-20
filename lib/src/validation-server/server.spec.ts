import request from "supertest";
import { parse } from "../neu/parser";
import { runValidationServer } from "./server";

const CONTRACT_PATH = "./lib/src/__examples__/contract.ts";

describe("Server", () => {
  const mockLogger = {
    log: (message: string) => message
  };

  const contract = parse(CONTRACT_PATH);

  describe("Run", () => {
    it("/health and return 200", done => {
      const { app } = runValidationServer(5907, contract, mockLogger);

      request(app)
        .get("/health")
        .expect(200)
        .then(_ => {
          done();
        });
    });
  });
});
