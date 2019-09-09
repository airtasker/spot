import JsonSchemaValidator from "ajv";
import { Contract, Endpoint } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { Type } from "../types";
import { err, ok, Result } from "../util";
import { Options, UserInputBody } from "./options";

export class ContractVerifier {
  private readonly config: ContractVerifierConfig;
  private readonly options: Options;
  private readonly contract: Contract;
  constructor(
    config: ContractVerifierConfig,
    options: Options,
    contract: Contract
  ) {
    this.config = config;
    this.options = options;
    this.contract = contract;
  }

  verify(): Array<Result<void, VerificationError>> {
    const results: Array<Result<void, VerificationError>> = [];
    const expectedEndpoint = this.getEndpointByOptions(
      this.options,
      this.contract
    );
    if (expectedEndpoint.isErr()) {
      results.concat(expectedEndpoint);
    } else {
      results.concat(
        this.verifyStatus(this.options.statusCode, expectedEndpoint.unwrap())
      );
      results.concat(this.verifyBody(this.options.body, this.contract.types));
    }
    return results;
  }

  /**
   * Check if an axios response status code matches the expected status code of an expected response definition.
   * @param expectedStatus
   * @param response
   */
  private verifyStatus(
    responseStatusCode: number,
    endpoint: Endpoint
  ): Result<void, VerificationError> {
    for (const expectedResponse of endpoint.responses) {
      const expectedStatusCode = expectedResponse.status;
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

  /**
   * Check if an exios response body matches the expected body of an expected response definition.
   *
   * @param expectedResponse expected response
   * @param response axios response
   * @param typeStore reference type definitions
   */
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

  private getEndpointByOptions(
    options: Options,
    contract: Contract
  ): Result<Endpoint, VerificationError> {
    for (const endpoint of contract.endpoints) {
      if (
        endpoint.path === options.path &&
        endpoint.method === options.method
      ) {
        return ok(endpoint);
      }
    }
    return err(
      new VerificationError(
        `Endpoint ${options.path} with Http Method of ${options.method} does not exist under the specified contract.`
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

export interface ContractVerifierConfig {
  baseStateUrl: string;
  baseUrl: string;
  debugMode?: boolean;
}
