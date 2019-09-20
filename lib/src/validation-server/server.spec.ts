import request from "supertest";
import { runValidationServer } from "./server";

describe("Server", () => {
  const mockLogger = {
    log: (message: string) => message
  };

  describe("Run", () => {
    it("/health and return 200", done => {
      const { app } = runValidationServer(5907, mockLogger);

      request(app)
        .get("/health")
        .expect(200)
        .then(_ => {
          done();
        });
    });
  });
});
