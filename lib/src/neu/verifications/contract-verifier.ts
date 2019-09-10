import JsonSchemaValidator from "ajv";
import { Contract, Endpoint, HttpMethod } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { Type } from "../types";
import { err, ok, Result } from "../util";
import {
  UserInput,
  UserInputBody,
  UserInputRequest,
  UserInputResponse
} from "./user-input-models";

export class ContractVerifier {
  constructor(private readonly contract: Contract) {}

  verify(
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse
  ): Array<Result<void, VerificationError>> {
    let results: Array<Result<void, VerificationError>> = [];
    const expectedEndpoint = this.getEndpointByRequest(
      userInputRequest,
      this.contract
    );
    // Return error if endpoint does not exist on the contract.
    if (expectedEndpoint.isErr()) {
      results = results.concat(expectedEndpoint);
    } else {
      // Body verifications.
      results = results.concat(
        this.verifyRequestResponseBodies(
          expectedEndpoint.unwrap(),
          userInputRequest,
          userInputResponse,
          this.contract.types
        )
      );
    }
    return results;
  }

  private verifyRequestResponseBodies(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse,
    typeArray: Array<{ name: string; type: Type }>
  ): Array<Result<void, VerificationError>> {
    let results: Array<Result<void, VerificationError>> = [];

    results = results.concat(
      this.verifyRequestBody(endpoint, userInputRequest, typeArray)
    );
    results = results.concat(
      this.verifyResponseBody(endpoint, userInputResponse, typeArray)
    );

    return results;
  }

  private verifyRequestBody(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest,
    typeArray: Array<{ name: string; type: Type }>
  ): Result<void, VerificationError> {
    const requestBodyTypeOnContract = this.getRequestBodyTypeOnContractEndpoint(
      endpoint
    );
    if (requestBodyTypeOnContract.isErr()) {
      return requestBodyTypeOnContract;
    }
    return this.verifyBody(
      userInputRequest.body,
      requestBodyTypeOnContract.unwrap(),
      typeArray
    );
  }

  private verifyResponseBody(
    endpoint: Endpoint,
    userInputResponse: UserInputResponse,
    typeArray: Array<{ name: string; type: Type }>
  ): Result<void, VerificationError> {
    const responseBodyTypeOncontract = this.getResponseBodyTypeOnContractEndpoint(
      endpoint,
      userInputResponse.statusCode
    );

    if (responseBodyTypeOncontract.isErr()) {
      return responseBodyTypeOncontract;
    }
    return this.verifyBody(
      userInputResponse.body,
      responseBodyTypeOncontract.unwrap(),
      typeArray
    );
  }

  private verifyBody(
    body: UserInputBody,
    contractBodyTypeToVerifyWith: Type,
    typeArray: Array<{ name: string; type: Type }>
  ): Result<void, VerificationError> {
    if (!body) {
      return ok(undefined);
    }

    const jsv = new JsonSchemaValidator();
    const schema = {
      ...generateJsonSchemaType(contractBodyTypeToVerifyWith),
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
      const errMessage = `Type does not exist in contract: ${jsv.errorsText(
        validateFn.errors
      )}\nReceived:\n${this.formatObject(body)}`;
      return err(new VerificationError(errMessage));
    }
  }

  private getRequestBodyTypeOnContractEndpoint(
    endpoint: Endpoint
  ): Result<Type, VerificationError> {
    if (!endpoint.request || !endpoint.request.body) {
      return err(
        new VerificationError(
          `Request body on endpoint path ${endpoint.path}:${endpoint.method} does not exist.`
        )
      );
    } else {
      return ok(endpoint.request.body.type);
    }
  }

  private getResponseBodyTypeOnContractEndpoint(
    endpoint: Endpoint,
    userInputStatusCode: number
  ): Result<Type, VerificationError> {
    if (endpoint.responses.length === 0) {
      return err(
        new VerificationError(
          `There is no response defined on endpoint path ${endpoint.path}:${endpoint.method}.`
        )
      );
    }
    for (const response of endpoint.responses) {
      if (response.status === userInputStatusCode) {
        if (!response.body) {
          return err(
            new VerificationError(
              `There is no response body defined on path ${endpoint.path}:${endpoint.method} with status code ${userInputStatusCode}.`
            )
          );
        }
        return ok(response.body.type);
      }
      return this.getDefaultResponseBodyTypeOnContractEndpoint(endpoint);
    }
    return err(
      new VerificationError(
        `Unexpected error in getting response body type on verifying ${endpoint.path}:${endpoint.method} with status code ${userInputStatusCode}`
      )
    );
  }

  private getDefaultResponseBodyTypeOnContractEndpoint(
    endpoint: Endpoint
  ): Result<Type, VerificationError> {
    if (!endpoint.defaultResponse || !endpoint.defaultResponse.body) {
      return err(
        new VerificationError(
          `Default response does not exist on ${endpoint.path}:${endpoint.method}.`
        )
      );
    }
    return ok(endpoint.defaultResponse.body.type);
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
