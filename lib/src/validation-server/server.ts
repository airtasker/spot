import express from "express";
import url from "url";
import { Contract } from "../neu/definitions";
import { ContractMismatcher } from "../neu/verifications/contract-mismatcher";
import {
  UserInputHeader,
  UserInputRequest,
  UserInputResponse
} from "../neu/verifications/user-input-models";
import { Logger } from "../utilities/logger";
import { Header, InternalServerError } from "./spots/utils";
import {
  RecordedRequest,
  RecordedResponse,
  ValidateRequest
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

      const mismatchesResult = contractValidator.findMismatch(
        userInputRequest,
        userInputResponse
      );

      if (mismatchesResult.isErr()) {
        const error = mismatchesResult.unwrapErr();
        res.status(500).send(makeInternalServerError([error.message]));
        return;
      }

      const mismatches = mismatchesResult.unwrap();
      const messages = mismatches.map(mismatch => mismatch.message);
      res.json(messages);
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

export const headersToUserInputHeader = (
  headers: Header[]
): UserInputHeader => {
  return headers.reduce(
    (userInputHeader, header, _0, _1) => {
      const newUserInputHeader = userInputHeader;
      newUserInputHeader[header.key] = header.value;
      return newUserInputHeader;
    },
    {} as UserInputHeader
  );
};

export const recordedRequestToUserInputRequest = (
  recordedRequest: RecordedRequest
): UserInputRequest => {
  const url = new URL(recordedRequest.url);
  const jsonBody = JSON.parse(recordedRequest.body);
  return {
    path: url.pathname,
    method: recordedRequest.method,
    headers: headersToUserInputHeader(recordedRequest.headers),
    body: jsonBody,
    queryParams: url.search // TODO: url.search will send the string with the leading "?",
    // query params are not verified yet, this should be aligned with the verifier implementation
  };
};

export const recordedResponseToUserInputResponse = (
  recordedResponse: RecordedResponse
): UserInputResponse => {
  const jsonBody = JSON.parse(recordedResponse.body);
  return {
    headers: headersToUserInputHeader(recordedResponse.headers),
    statusCode: recordedResponse.status,
    body: jsonBody
  };
};
