import JsonSchemaValidator from "ajv";
import { AxiosResponse } from "axios";
import { Contract, Response } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { Options } from "./options";

export class ContractVerifier {
  private readonly config: ContractVerifierConfig;
  constructor(config: ContractVerifierConfig) {
    this.config = config;
  }

  /**
   * Check if an axios response status code matches the expected status code of an expected response definition.
   * @param expectedStatus
   * @param response
   */
  private verifyStatus(
    expectedStatus: number,
    response: AxiosResponse
  ): Result<void, VerificationError> {
    if (expectedStatus === response.status) {
      return ok(undefined);
    } else {
      const errMessage = `Expected status ${expectedStatus}, got ${response.status}`;
      return err(new VerificationError(errMessage));
    }
  }

  /**
   * Check if an exios response body matches the expected body of an expected response definition.
   *
   * @param expectedResponse expected response
   * @param response axios response
   * @param typeStore reference type definitions
   */
  private verifyBody(
    expectedResponse: Response,
    response: AxiosResponse<any>,
    typeTable: TypeTable
  ): Result<void, VerificationError> {
    if (!expectedResponse || !expectedResponse.body) {
      return ok(undefined);
    }

    const jsv = new JsonSchemaValidator();
    const schema = {
      ...generateJsonSchemaType(expectedResponse.body.type),
      definitions: typeTable
        .toArray()
        .reduce<{ [key: string]: JsonSchemaType }>((defAcc, typeNode) => {
          return {
            [typeNode.name]: generateJsonSchemaType(typeNode.type),
            ...defAcc
          };
        }, {})
    };
    const validateFn = jsv.compile(schema);
    const valid = validateFn(response.data);
    if (valid) {
      return ok(undefined);
    }
    const errMessage = `Body is not compliant: ${jsv.errorsText(
      validateFn.errors
    )}\nReceived:\n${this.formatObject(response.data)}`;
    return err(new VerificationError(errMessage));
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
