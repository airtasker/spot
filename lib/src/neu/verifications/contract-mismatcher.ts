import JsonSchemaValidator, { ErrorObject } from "ajv";
import { element } from "prop-types";
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

export class ContractMismatcher {
  private readonly PATH_PARAM_REGEX = /:[^\/]*/g;
  constructor(private readonly contract: Contract) {}

  findMismatch(
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse
  ): Result<Mismatch[], Error> {
    const expectedEndpoint = this.getEndpointByRequest(userInputRequest);
    // Return mismatch if endpoint does not exist on the contract.
    if (expectedEndpoint.isErr()) {
      return ok([new Mismatch(expectedEndpoint.unwrapErr().message)]);
    } else {
      const mismatches: Mismatch[] = [];

      // Body verifications.
      const mismatchesOnRequestBody = this.findMismatchOnRequestBody(
        expectedEndpoint.unwrap(),
        userInputRequest
      );

      const mismatchesOnResponseBody = this.findMismatchOnResponseBody(
        expectedEndpoint.unwrap(),
        userInputResponse
      );

      if (mismatchesOnRequestBody.isErr()) {
        return mismatchesOnRequestBody;
      }

      if (mismatchesOnResponseBody.isErr()) {
        return mismatchesOnResponseBody;
      }

      mismatches.push(...mismatchesOnRequestBody.unwrap());
      mismatches.push(...mismatchesOnResponseBody.unwrap());
      this.findMismatchOnRequestPathParam(
        expectedEndpoint.unwrap(),
        userInputRequest
      );
      return ok(mismatches);
    }
  }

  private findMismatchOnRequestPathParam(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest
  ): void {
    const contractPathArray = endpoint.path.split("/");
    const userPathArray = this.getSeparatedPathFromQueries(
      userInputRequest.path
    )[0].split("/");
    const result: any[] = [];
    contractPathArray.forEach((p, i) => {
      if (p.startsWith(":")) {
        result.push({ [p.substr(1)]: userPathArray[i] });
      }
    });
    console.log(result);
  }

  private findMismatchOnRequestBody(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest
  ): Result<Mismatch[], Error> {
    const requestBodyTypeOnContract = this.getRequestBodyTypeOnContractEndpoint(
      endpoint
    );
    const mismatches: Mismatch[] = [];
    if (requestBodyTypeOnContract.isErr()) {
      const mismatch = new Mismatch(
        requestBodyTypeOnContract.unwrapErr().message
      );
      mismatches.push(mismatch);
      return ok(mismatches);
    }
    return this.findMismatchOnBody(
      userInputRequest.body,
      requestBodyTypeOnContract.unwrap()
    );
  }

  private findMismatchOnResponseBody(
    endpoint: Endpoint,
    userInputResponse: UserInputResponse
  ): Result<Mismatch[], Error> {
    const responseBodyTypeOncontract = this.getResponseBodyTypeOnContractEndpoint(
      endpoint,
      userInputResponse.statusCode
    );

    if (responseBodyTypeOncontract.isErr()) {
      return responseBodyTypeOncontract;
    }

    // If contract response body does not have a type, then there is no mismatch.
    const contractResponseBodyType = responseBodyTypeOncontract.unwrap();
    if (!contractResponseBodyType) {
      return ok([]);
    }
    return this.findMismatchOnBody(
      userInputResponse.body,
      contractResponseBodyType
    );
  }

  private findMismatchOnBody(
    body: UserInputBody,
    contractBodyTypeToVerifyWith: Type
  ): Result<Mismatch[], Error> {
    if (!body) {
      return ok([]);
    }

    const jsv = new JsonSchemaValidator();
    const schema = {
      ...generateJsonSchemaType(contractBodyTypeToVerifyWith),
      definitions: this.contract.types.reduce<{
        [key: string]: JsonSchemaType;
      }>((defAcc, typeNode) => {
        return {
          [typeNode.name]: generateJsonSchemaType(typeNode.type),
          ...defAcc
        };
      }, {})
    };

    const validateFn = jsv.compile(schema);
    const valid = validateFn(body);
    if (valid) {
      return ok([]);
    } else {
      if (!validateFn.errors) {
        return err(
          new Error(
            `Body Validation reaches unexpected error for ${body} with contract body ${contractBodyTypeToVerifyWith}`
          )
        );
      }
      return ok(this.errorObjectMapper(validateFn.errors));
    }
  }

  private errorObjectMapper(array: ErrorObject[]): Mismatch[] {
    return array.map(e => {
      return new Mismatch(
        e.message ||
          `JsonSchemaValidator encountered an unexpected error for ${e.data}.`
      );
    });
  }

  private getRequestBodyTypeOnContractEndpoint(
    endpoint: Endpoint
  ): Result<Type, Error> {
    if (!endpoint.request || !endpoint.request.body) {
      return err(
        new Error(
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
  ): Result<Type | undefined, Error> {
    if (endpoint.responses.length === 0) {
      return err(
        new Error(
          `There is no response defined on endpoint path ${endpoint.path}:${endpoint.method}.`
        )
      );
    }
    for (const response of endpoint.responses) {
      if (response.status === userInputStatusCode) {
        if (!response.body) {
          // If contract response body does not have a type, then there is no mismatch.
          return ok(undefined);
        }
        return ok(response.body.type);
      }
    }
    return this.getDefaultResponseBodyTypeOnContractEndpoint(endpoint);
  }

  private getDefaultResponseBodyTypeOnContractEndpoint(
    endpoint: Endpoint
  ): Result<Type, Error> {
    if (!endpoint.defaultResponse || !endpoint.defaultResponse.body) {
      return err(
        new Error(
          `Default response does not exist on ${endpoint.path}:${endpoint.method}.`
        )
      );
    }
    return ok(endpoint.defaultResponse.body.type);
  }

  private getEndpointByRequest(
    userInputRequest: UserInputRequest
  ): Result<Endpoint, Error> {
    for (const endpoint of this.contract.endpoints) {
      if (
        this.isMatchedToContractPath(userInputRequest.path, endpoint.path) &&
        endpoint.method === userInputRequest.method
      ) {
        return ok(endpoint);
      }
    }
    return err(
      new Error(
        `Endpoint ${userInputRequest.path} with Http Method of ${userInputRequest.method} does not exist under the specified contract.`
      )
    );
  }

  private isMatchedToContractPath(
    userInputPath: string,
    contractPath: string
  ): boolean {
    const replacedContractPathPattern = contractPath.replace(
      this.PATH_PARAM_REGEX,
      ".+"
    );
    const regexp = new RegExp(replacedContractPathPattern);
    return regexp.test(userInputPath);
  }

  private getSeparatedPathFromQueries(path: string): string[] {
    return path.split("?");
  }
}

export class Mismatch {
  constructor(readonly message: string) {}
}
