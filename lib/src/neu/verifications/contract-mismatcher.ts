import JsonSchemaValidator, { ErrorObject } from "ajv";
import qs from "qs";
import * as url from "url";
import {
  Body,
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  Response
} from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { Type, TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { StringInput, StringValidator } from "./string-validator";
import {
  UserInputBody,
  UserInputHeader,
  UserInputRequest,
  UserInputResponse
} from "./user-input-models";

export class ContractMismatcher {
  private typeTable: TypeTable;

  constructor(private readonly contract: Contract) {
    this.typeTable = TypeTable.fromArray(this.contract.types);
  }

  findMismatch(
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse
  ): Result<Mismatch[], Error> {
    const mismatches: Mismatch[] = [];

    // Get endpoint
    // Return mismatch if endpoint does not exist on the contract.
    const expectedEndpointResult = this.getEndpointByRequest(userInputRequest);
    if (expectedEndpointResult.isErr()) {
      return ok([new Mismatch(expectedEndpointResult.unwrapErr().message)]);
    }
    const expectedEndpoint = expectedEndpointResult.unwrap();

    // Get request
    const expectedRequest = expectedEndpoint.request;

    // Get response
    const expectedResponseResult = this.getRelevantResponse(
      expectedEndpoint,
      userInputResponse.statusCode
    );
    if (expectedResponseResult.isErr()) return expectedResponseResult;
    const expectedResponse = expectedResponseResult.unwrap();

    // Find request header mismatches
    const requestHeaderMismatchesResult = this.findHeaderMismatches(
      (expectedRequest && expectedRequest.headers) || [],
      userInputRequest.headers,
      true
    );
    if (requestHeaderMismatchesResult.isErr()) {
      return requestHeaderMismatchesResult;
    }
    mismatches.push(...requestHeaderMismatchesResult.unwrap());

    // Find response header mismatches
    const responseHeaderMismatchesResult = this.findHeaderMismatches(
      expectedResponse.headers,
      userInputResponse.headers
    );
    if (responseHeaderMismatchesResult.isErr()) {
      return responseHeaderMismatchesResult;
    }
    mismatches.push(...responseHeaderMismatchesResult.unwrap());

    // Find request body mismatches
    const requestBodyMismatchesResult = this.findBodyMismatches(
      expectedRequest && expectedRequest.body,
      userInputRequest.body,
      true
    );
    if (requestBodyMismatchesResult.isErr()) {
      return requestBodyMismatchesResult;
    }
    mismatches.push(...requestBodyMismatchesResult.unwrap());

    // Find response body mismatches
    const responseBodyMismatchesResult = this.findBodyMismatches(
      expectedResponse.body,
      userInputResponse.body
    );
    if (responseBodyMismatchesResult.isErr()) {
      return responseBodyMismatchesResult;
    }
    mismatches.push(...responseBodyMismatchesResult.unwrap());

    // Find path parameter mismatches
    const pathParamMismatches = this.findPathParamMismatches(
      expectedEndpoint,
      userInputRequest.path
    );
    if (pathParamMismatches.isErr()) {
      return pathParamMismatches;
    }
    mismatches.push(...pathParamMismatches.unwrap());

    // Find query parameter mismatches
    const queryParamMismatches = this.findQueryParamMismatches(
      expectedEndpoint,
      userInputRequest.path
    );
    if (queryParamMismatches.isErr()) {
      return pathParamMismatches;
    }
    mismatches.push(...queryParamMismatches.unwrap());

    return ok(mismatches);
  }

  private findHeaderMismatches(
    contractHeaders: Header[],
    inputHeaders: UserInputHeader[],
    strict: boolean = false
  ): Result<Mismatch[], Error> {
    const mismatches: Mismatch[] = [];

    for (const header of contractHeaders) {
      const inputHeader = inputHeaders.find(iH => iH.name === header.name);
      if (inputHeader === undefined) {
        if (!header.optional) {
          mismatches.push(
            new Mismatch(`Header "${header.name}" missing on endpoint`)
          );
        }
        continue;
      }

      const typeMismatches = this.findMismatchOnStringContent(
        { name: inputHeader.name, value: inputHeader.value },
        header.type
      );
      mismatches.push(...typeMismatches);
    }

    if (strict) {
      inputHeaders
        .filter(iH => !contractHeaders.some(header => header.name === iH.name))
        .forEach(iH => {
          mismatches.push(
            new Mismatch(`Header "${iH.name}" not found on endpoint`)
          );
        });
    }

    return ok(mismatches);
  }

  private findPathParamMismatches(
    contractEndpoint: Endpoint,
    inputPath: string
  ): Result<Mismatch[], Error> {
    const contractPathParams =
      (contractEndpoint.request && contractEndpoint.request.pathParams) || [];

    const contractPathArray = contractEndpoint.path.split("/");
    const inputPathArray = inputPath.split("?")[0].split("/");

    // Sanity check, this should never happen if called after ensuring the input path matches the correct endpoint
    if (contractPathArray.length !== inputPathArray.length) {
      return err(
        new Error(
          `Unexpected error: endpoint path (${contractEndpoint.path}) does not match input path (${inputPath})`
        )
      );
    }

    const mismatches: Mismatch[] = [];
    for (let i = 0; i < contractPathArray.length; i++) {
      if (contractPathArray[i].startsWith(":")) {
        const contractPathParam = contractPathParams.find(
          param => param.name === contractPathArray[i].substr(1)
        );

        if (!contractPathParam) {
          return err(
            new Error(
              "Unexpected error: could not find path param on contract."
            )
          );
        }
        const contractPathParamType = contractPathParam.type;

        const pathParamMismatches = this.findMismatchOnStringContent(
          { name: contractPathParam.name, value: inputPathArray[i] },
          contractPathParamType
        );
        mismatches.push(...pathParamMismatches);
      }
    }
    return ok(mismatches);
  }

  private findBodyMismatches(
    contractBody: Body | undefined,
    inputBody: UserInputBody,
    strict: boolean = false
  ): Result<Mismatch[], Error> {
    if (contractBody === undefined) {
      if (inputBody === undefined) {
        return ok([]);
      }
      if (strict) {
        return ok([
          new Mismatch("contract body has no type, but a body was given")
        ]);
      }
      return ok([]);
    }

    const jsv = new JsonSchemaValidator({
      format: "full"
    });
    const schema = {
      ...generateJsonSchemaType(contractBody.type, !strict),
      definitions: this.contract.types.reduce<{
        [key: string]: JsonSchemaType;
      }>((defAcc, typeNode) => {
        return {
          [typeNode.name]: generateJsonSchemaType(typeNode.type, !strict),
          ...defAcc
        };
      }, {})
    };
    const validateFn = jsv.compile(schema);
    const valid = validateFn(inputBody);

    if (valid) {
      return ok([]);
    }

    if (!validateFn.errors) {
      return err(
        new Error(
          `Body Validation reaches unexpected error for ${inputBody} with contract body ${contractBody.type}`
        )
      );
    }
    return ok(this.errorObjectMapper(validateFn.errors, inputBody));
  }

  private getQueryParamsArraySerializationStrategy(): { comma: boolean } {
    const comma =
      this.contract.config.paramSerializationStrategy.query.array === "comma";

    return { comma };
  }

  private findQueryParamMismatches(
    contractEndpoint: Endpoint,
    inputPath: string
  ): Result<Mismatch[], Error> {
    const contractQueryParams =
      (contractEndpoint.request && contractEndpoint.request.queryParams) || [];

    const queryStringComponent = url.parse(inputPath).query || "";

    const inputQueryParams = qs.parse(queryStringComponent, {
      ...this.getQueryParamsArraySerializationStrategy()
    });

    // Map to mark parameters that have been checked
    // Params that could not be checked have their flag set to false
    const verifiedQueryParams = Object.keys(inputQueryParams).reduce(
      (acc: { [_: string]: boolean }, key) => ({ ...acc, [key]: false }),
      {}
    );

    let result;
    let mismatches: Mismatch[] = [];
    for (const {
      name: queryParamName,
      optional,
      type: contractQueryParamType
    } of contractQueryParams) {
      const requestQueryParam = inputQueryParams[queryParamName];

      // Query parameter is optional, can be skipped
      if (typeof requestQueryParam === "undefined" && optional) {
        continue;
      }

      // Query parameter is mandatory and hasn't been provided
      if (typeof requestQueryParam === "undefined") {
        mismatches.push(
          new Mismatch(
            `Query parameter "${queryParamName}" is required but hasn't been provided.`
          )
        );
        continue;
      }

      // Mark query param as verified
      verifiedQueryParams[queryParamName] = true;

      // Validate current request query param against contract
      result = this.findMismatchOnStringContent(
        { name: queryParamName, value: requestQueryParam },
        contractQueryParamType
      );

      mismatches.push(...result);
    }

    const checkForNonExistingParams = () =>
      Object.entries(verifiedQueryParams)
        .filter(([_, value]) => !value)
        .map(
          ([key, _]) =>
            new Mismatch(
              `Query parameter "${key}" does not exist under the specified endpoint.`
            )
        );

    mismatches = [...mismatches, ...checkForNonExistingParams()];

    return ok(mismatches);
  }

  private findMismatchOnStringContent(
    content: StringInput,
    contractContentTypeToCheckWith: Type
  ): Mismatch[] {
    // TODO: why would this ever happen?
    // if (!content) {
    //   return ok([]);
    // }

    const stringValidator = new StringValidator(this.typeTable);

    const valid = stringValidator.run(content, contractContentTypeToCheckWith);

    if (valid) {
      return [];
    }
    return stringValidator.messages.map(m => new Mismatch(m));
  }

  private errorObjectMapper(
    array: ErrorObject[],
    inputBody: UserInputBody
  ): Mismatch[] {
    return array.map(e => {
      const message = e.message
        ? `${JSON.stringify(inputBody)}: ${e.schemaPath} ${e.message}`
        : `JsonSchemaValidator encountered an unexpected error for ${e.data}.`;
      return new Mismatch(message);
    });
  }

  private getRelevantResponse(
    endpoint: Endpoint,
    userInputStatusCode: number
  ): Result<Response | DefaultResponse, Error> {
    if (endpoint.responses.length > 0) {
      for (const contractResponse of endpoint.responses) {
        if (contractResponse.status === userInputStatusCode) {
          return ok(contractResponse);
        }
      }
    }

    if (endpoint.defaultResponse) {
      return ok(endpoint.defaultResponse);
    }

    // No response headers defined on the contract. This is ok for responses.
    return err(
      new Error(
        `There is no response or default response defined on ${endpoint.path}:${endpoint.method}`
      )
    );
  }

  private getEndpointByRequest(
    userInputRequest: UserInputRequest
  ): Result<Endpoint, Error> {
    const userInputRequestPath = userInputRequest.path.split("?")[0];

    const endpoint = this.contract.endpoints.find((value, _0, _1) => {
      return (
        value.method === userInputRequest.method.toUpperCase() &&
        pathMatchesVariablePath(value.path, userInputRequestPath)
      );
    });

    if (endpoint) {
      return ok(endpoint);
    }

    return err(
      new Error(
        `Endpoint ${userInputRequest.method} ${userInputRequest.path} not found.`
      )
    );
  }
}

// Transform /a/:b/c/:d/e -> /^/a/.+/c/.+/e$/
const regexForVariablePath = (path: string): RegExp => {
  const regexp = path.replace(/:[^\/]+/g, ".+");
  return new RegExp(`^${regexp}$`);
};

export const pathMatchesVariablePath = (
  variablePath: string,
  path: string
): boolean => {
  const variablePathRegex = regexForVariablePath(variablePath);
  return variablePathRegex.test(path);
};

export class Mismatch {
  constructor(readonly message: string) {}
}
