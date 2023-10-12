import express from "express";
import { Contract } from "../definitions";
import { InternalServerError } from "./spots/utils";
import {
  RecordedRequest,
  RecordedResponse,
  ValidateRequest,
  ValidateResponse
} from "./spots/validate";
import { ContractMismatcher } from "./verifications/contract-mismatcher";
import {
  UserInputRequest,
  UserInputResponse
} from "./verifications/user-input-models";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function runValidationServer(port: number, contract: Contract) {
  const app = express();

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).end();
  });

  app.post("/validate", (req, res) => {
    try {
      // TODO: Make sure body matches ValidateRequest, we should
      // send a 422 if it doesn't match
      const body = req.body as ValidateRequest;

      const userInputRequest = recordedRequestToUserInputRequest(body.request);
      const userInputResponse = recordedResponseToUserInputResponse(
        body.response
      );

      const contractValidator = new ContractMismatcher(contract);

      const { violations, context } = contractValidator.findViolations(
        userInputRequest,
        userInputResponse
      );

      const responseBody: ValidateResponse = {
        interaction: {
          request: body.request,
          response: body.response
        },
        endpoint: context.endpoint,
        violations
      };
      res.json(responseBody);
    } catch (error) {
      res.status(500).send(makeInternalServerError([(error as Error).message]));
    }
  });

  return {
    app,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    defer: () => new Promise<void>(resolve => app.listen(port, resolve))
  };
}

const makeInternalServerError = (messages: string[]): InternalServerError => {
  return {
    type: "internal_server",
    error_code: "500",
    error_messages: messages
  };
};

export const recordedRequestToUserInputRequest = (
  recordedRequest: RecordedRequest
): UserInputRequest => {
  return {
    path: recordedRequest.path,
    method: recordedRequest.method,
    headers: recordedRequest.headers,
    body: recordedRequest.body && JSON.parse(recordedRequest.body)
  };
};

export const recordedResponseToUserInputResponse = (
  recordedResponse: RecordedResponse
): UserInputResponse => {
  return {
    headers: recordedResponse.headers,
    statusCode: recordedResponse.status,
    body: recordedResponse.body && JSON.parse(recordedResponse.body)
  };
};
