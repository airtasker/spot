import JsonSchemaValidator from "ajv";
import { Contract, Endpoint } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { Type } from "../types";
import { err, ok, Result } from "../util";
import {
  UserInputBody,
  UserInputRequest,
  UserInputResponse
} from "./user-input-models";

export class ContractVerifier {
  private readonly userInputRequest: UserInputRequest;
  private readonly userInputResponse: UserInputResponse;
  private readonly contract: Contract;
  constructor(
    contract: Contract,
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse
  ) {
    this.userInputRequest = userInputRequest;
    this.userInputResponse = userInputResponse;
    this.contract = contract;
  }

  verify(): Array<Result<void, VerificationError>> {
    let results: Array<Result<void, VerificationError>> = [];
    const expectedEndpoint = this.getEndpointByRequest(
      this.userInputRequest,
      this.contract
    );
    if (expectedEndpoint.isErr()) {
      results = results.concat(expectedEndpoint);
    } else {
      results = results.concat(
        this.verifyStatus(
          this.userInputResponse.statusCode,
          expectedEndpoint.unwrap()
        )
      );
      results = results.concat(
        this.verifyBody(this.userInputRequest.body, this.contract.types)
      );
      results = results.concat(
        this.verifyBody(this.userInputResponse.body, this.contract.types)
      );
    }
    return results;
  }

  private verifyStatus(
    responseStatusCode: string,
    endpoint: Endpoint
  ): Result<void, VerificationError> {
    if (responseStatusCode === "default") {
      if (!endpoint.defaultResponse) {
        return err(
          new VerificationError(
            `default response on path ${endpoint.path} does not exist when trying to verify it.`
          )
        );
      }
      return ok(undefined);
    }
    for (const expectedResponse of endpoint.responses) {
      const expectedStatusCode = expectedResponse.status.toString();
      if (expectedStatusCode === responseStatusCode) {
        return ok(undefined);
      }
    }
    return err(
      new VerificationError(
        `Expected status ${responseStatusCode}, does not exist on contract path ${endpoint.path}`
      )
    );
  }

  private verifyBody(
    body: UserInputBody,
    typeArray: Array<{ name: string; type: Type }>
  ): Result<void, VerificationError> {
    if (!body) {
      return ok(undefined);
    }

    const jsv = new JsonSchemaValidator();
    const schema = {
      ...generateJsonSchemaType(body.type),
      definitions: typeArray.reduce<{ [key: string]: JsonSchemaType }>(
        (defAcc, typeNode) => {
          return {
            [typeNode.name]: generateJsonSchemaType(typeNode.type),
            ...defAcc
          };
        },
        {}
      )
    };
    const validateFn = jsv.compile(schema);
    const valid = validateFn(body);
    if (valid) {
      return ok(undefined);
    } else {
      const errMessage = `Body is not compliant to JSON schema standard: ${jsv.errorsText(
        validateFn.errors
      )}\nReceived:\n${this.formatObject(body)}`;
      return err(new VerificationError(errMessage));
    }
  }

  private getEndpointByRequest(
    userInputRequest: UserInputRequest,
    contract: Contract
  ): Result<Endpoint, VerificationError> {
    for (const endpoint of contract.endpoints) {
      if (
        endpoint.path === userInputRequest.path &&
        endpoint.method === userInputRequest.method
      ) {
        return ok(endpoint);
      }
    }
    return err(
      new VerificationError(
        `Endpoint ${userInputRequest.path} with Http Method of ${userInputRequest.method} does not exist under the specified contract.`
      )
    );
  }

  private formatObject(obj: any): string {
    return JSON.stringify(obj, undefined, 2);
  }
}

export class VerificationError extends Error {
  constructor(readonly message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
