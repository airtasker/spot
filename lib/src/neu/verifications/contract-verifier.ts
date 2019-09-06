import JsonSchemaValidator from "ajv";
import { AxiosResponse } from "axios";
import { Contract, Response } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { TypeTable } from "../types";
import { Options } from "./options";
import { VerificationLogger } from "./verification-logger";

export class ContractVerifier {
  private readonly logger: VerificationLogger;
  constructor(config: ContractVerifierConfig) {
    this.logger = new VerificationLogger(config.printer, {
      debugMode: config.debugMode
    });
  }
  verifyContract(contract: Contract, options: Options) {}

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
  ): boolean {
    if (!expectedResponse || !expectedResponse.body) {
      return true;
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
      this.logger.success("Body compliant", { indent: 2 });
      return true;
    }
    this.logger.error(
      `Body is not compliant: ${jsv.errorsText(
        validateFn.errors
      )}\nReceived:\n${VerificationLogger.formatObject(response.data)}`,
      { indent: 2 }
    );
    return false;
  }
}

export interface ContractVerifierConfig {
  printer: (message: string) => void;
  baseStateUrl: string;
  baseUrl: string;
  debugMode?: boolean;
}
