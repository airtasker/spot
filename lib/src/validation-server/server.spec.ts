import request from "supertest";
import { parse } from "../neu/parser";
import {
  recordedRequestToUserInputRequest,
  recordedResponseToUserInputResponse,
  runValidationServer
} from "./server";

const CONTRACT_PATH = "./lib/src/__examples__/contract.ts";
const DUMMY_BODY = { dummy: "helloworld" };
const DUMMY_PORT = 5907;

describe("Validation Server", () => {
  const mockLogger = {
    log: (message: string) => message,
    error: (message: string) => message
  };

  const contract = parse(CONTRACT_PATH);

  describe("/health", () => {
    it("should return 200", async () => {
      const { app } = runValidationServer(DUMMY_PORT, contract, mockLogger);

      await request(app)
        .get("/health")
        .expect(200);
    });
  });

  describe("/validate", () => {
    it("should return no violations for valid request/response pair", async () => {
      const { app } = runValidationServer(DUMMY_PORT, contract, mockLogger);

      const validRequestAndResponse = {
        request: {
          method: "POST",
          path: "/company/123/users",
          headers: [{ name: "x-auth-token", value: "helloworld" }],
          body: JSON.stringify({
            data: {
              firstName: "",
              lastName: "",
              age: 0,
              email: "",
              address: ""
            }
          })
        },
        response: {
          status: 201,
          headers: [{ name: "Location", value: "hello" }],
          body: JSON.stringify({
            data: {
              firstName: "",
              lastName: "",
              profile: {
                private: false,
                messageOptions: {
                  newsletter: false
                }
              }
            }
          })
        }
      };

      await request(app)
        .post("/validate")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .send(validRequestAndResponse)
        .expect(200)
        .then(response => {
          // Expecting no violations
          expect(response.body.violations).toEqual([]);
          expect(response.body.endpoint).toEqual("CreateUser");
        });
    });

    it("should return violations for invalid request/response pair", async () => {
      const { app } = runValidationServer(DUMMY_PORT, contract, mockLogger);

      const requestAndResponseWithViolations = {
        request: {
          method: "POST",
          path: "/company/123/users",
          headers: [{ name: "x-auth-token", value: "helloworld" }],
          body: "{}"
        },
        response: {
          status: 200,
          headers: [{ name: "a", value: "b" }],
          body: "{}"
        }
      };

      await request(app)
        .post("/validate")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .send(requestAndResponseWithViolations)
        .expect(200)
        .then(response => {
          expect(response.body.violations).toEqual([
            {
              type: "request_body_type_mismatch",
              message:
                "Request body type mismatch:\n{}\n- # should have required property 'data'",
              type_violations: ["# should have required property 'data'"]
            },
            {
              type: "response_body_type_mismatch",
              message:
                "Response body type mismatch:\n{}\n- # should have required property 'name'\n- # should have required property 'message'",
              type_violations: [
                "# should have required property 'name'",
                "# should have required property 'message'"
              ]
            }
          ]);
          expect(response.body.endpoint).toEqual("CreateUser");
        });
    });

    it("should return 500 for invalid body", async () => {
      const { app } = runValidationServer(DUMMY_PORT, contract, mockLogger);

      await request(app)
        .post("/validate")
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .send(DUMMY_BODY)
        .expect(500)
        .then(response => {
          expect(response.body.error_code).toEqual("500");
          expect(response.body.type).toEqual("internal_server");
          expect(response.body.error_messages).toHaveLength(1);
        });
    });
  });
});

describe("Transformation functions", () => {
  describe("recordedRequestToUserInputRequest", () => {
    it("should transform RecordedRequest into UserInputRequest", () => {
      expect(
        recordedRequestToUserInputRequest({
          method: "POST",
          path: "/path/to/somewhere?hello=world",
          headers: [{ name: "a", value: "b" }, { name: "c", value: "d" }],
          body: JSON.stringify({ data: "body" })
        })
      ).toEqual({
        path: "/path/to/somewhere?hello=world",
        method: "POST",
        headers: [{ name: "a", value: "b" }, { name: "c", value: "d" }],
        body: { data: "body" }
      });
    });
  });

  describe("recordedResponseToUserInputResponse", () => {
    it("should transform RecordedResponse into UserInputResponse", () => {
      expect(
        recordedResponseToUserInputResponse({
          status: 200,
          headers: [{ name: "a", value: "b" }, { name: "c", value: "d" }],
          body: JSON.stringify({ data: "body" })
        })
      ).toEqual({
        headers: [{ name: "a", value: "b" }, { name: "c", value: "d" }],
        statusCode: 200,
        body: { data: "body" }
      });
    });
  });
});
