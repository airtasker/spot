import express from "express";
import { Contract } from "../neu/definitions";
import { ContractMismatcher } from "../neu/verifications/contract-mismatcher";
import {
  UserInputRequest,
  UserInputResponse
} from "../neu/verifications/user-input-models";
import { Logger } from "../utilities/logger";
import { InternalServerError } from "./spots/utils";
import {
  RecordedRequest,
  RecordedResponse,
  ValidateRequest,
  ValidateResponse
} from "./spots/validate";

export function runValidationServer(
  port: number,
  contract: Contract,
  logger: Logger
) {
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

      const validatorResult = contractValidator.findViolations(
        userInputRequest,
        userInputResponse
      );

      if (validatorResult.isErr()) {
        const error = validatorResult.unwrapErr();
        res.status(500).send(makeInternalServerError([error.message]));
        return;
      }

      const { violations, context } = validatorResult.unwrap();
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
      res.status(500).send(makeInternalServerError([error.message]));
    }
  });

  return {
    app,
    defer: () => new Promise(resolve => app.listen(port, resolve))
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
