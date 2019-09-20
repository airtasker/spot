import JsonSchemaValidator, { ErrorObject } from "ajv";
import {
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  Response
} from "../definitions";
import qs from "qs";
import * as url from "url";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { JsonSchemaType } from "../schemas/json-schema";
import { Type } from "../types";
import { err, ok, Result } from "../util";
import {
  UserContent,
  UserInputHeader,
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

      // Header mismatch finding.
      const mismatchesOnRequestHeader = this.findMismatchOnRequestHeader(
        expectedEndpoint.unwrap(),
        userInputRequest
      );

      if (mismatchesOnRequestHeader.isErr()) {
        return mismatchesOnRequestHeader;
      }

      const mismatchesOnResponseHeader = this.findMismatchOnResponseHeader(
        expectedEndpoint.unwrap(),
        userInputResponse
      );

      if (mismatchesOnResponseHeader.isErr()) {
        return mismatchesOnResponseHeader;
      }

      mismatches.push(...mismatchesOnRequestHeader.unwrap());
      mismatches.push(...mismatchesOnResponseHeader.unwrap());

      // Body mismatch finding.
      const mismatchesOnRequestBody = this.findMismatchOnRequestBody(
        expectedEndpoint.unwrap(),
        userInputRequest
      );

      if (mismatchesOnRequestBody.isErr()) {
        return mismatchesOnRequestBody;
      }

      const mismatchesOnResponseBody = this.findMismatchOnResponseBody(
        expectedEndpoint.unwrap(),
        userInputResponse
      );

      if (mismatchesOnResponseBody.isErr()) {
        return mismatchesOnResponseBody;
      }

      mismatches.push(...mismatchesOnRequestBody.unwrap());
      mismatches.push(...mismatchesOnResponseBody.unwrap());

      // Path params mismatch finding
      const pathParamMismatches = this.findMismatchOnRequestPathParam(
        expectedEndpoint.unwrap(),
        userInputRequest
      );
      if (pathParamMismatches.isErr()) {
        return pathParamMismatches;
      }
      mismatches.push(...pathParamMismatches.unwrap());

      const queryParamsMismatches = this.findMismatchOnRequestQueryParams(
        expectedEndpoint.unwrap(),
        userInputRequest
      );
      if (queryParamsMismatches.isErr()) {
        return pathParamMismatches;
      }
      mismatches.push(...queryParamsMismatches.unwrap());

      return ok(mismatches);
    }
  }

  private findMismatchOnRequestHeader(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest
  ): Result<Mismatch[], Error> {
    if (userInputRequest && !endpoint.request) {
      return ok([
        new Mismatch(
          `A request header was provided but there is no request defined in the contract under path: ${endpoint.path}:${endpoint.method}`
        )
      ]);
    }

    if (
      Object.keys(userInputRequest.headers).length <
      endpoint.request!!.headers.length
    ) {
      return ok([
        new Mismatch(
          `${JSON.stringify(
            userInputRequest.headers
          )} does not conform to the request contract headers on path: ${
            endpoint.path
          }:${endpoint.method}`
        )
      ]);
    }

    const mismatches: Mismatch[] = Object.keys(userInputRequest.headers).reduce(
      (accumulator: Mismatch[], userInputHeaderKey: string) => {
        const contractHeaderType = this.getTypeOnContractRequestHeaders(
          endpoint,
          userInputHeaderKey
        );
        if (contractHeaderType.isErr()) {
          accumulator.push(
            new Mismatch(contractHeaderType.unwrapErr().message)
          );

          return accumulator;
        }

        const result = this.findMismatchOnContent(
          userInputRequest.headers[userInputHeaderKey],
          contractHeaderType.unwrap()
        );

        if (result.isErr()) {
          accumulator.push(new Mismatch(result.unwrapErr().message));
        } else {
          accumulator.push(...result.unwrap());
        }
        return accumulator;
      },
      []
    );
    return ok(mismatches);
  }

  private findMismatchOnResponseHeader(
    endpoint: Endpoint,
    userInputResponse: UserInputResponse
  ): Result<Mismatch[], Error> {
    if (endpoint.responses.length === 0 && !endpoint.defaultResponse) {
      return err(
        new Error(
          `There is no response or default defined in the contract under path: ${endpoint.path}`
        )
      );
    }
    const contractHeaders = this.getResponseHeadersOnContractEndpoint(
      endpoint,
      userInputResponse.statusCode
    );

    if (contractHeaders.isErr()) {
      return contractHeaders;
    }
    const unwrappedContractHeaders = contractHeaders.unwrap();

    const mismatches: Mismatch[] = Object.values(
      unwrappedContractHeaders
    ).reduce((accumulator: Mismatch[], contractHeader: Header) => {
      const contractHeaderType = contractHeader.type;

      const matchingHeaderNameOnUserInput = Object.keys(
        userInputResponse.headers
      ).find(
        headerName =>
          headerName.toLowerCase() === contractHeader.name.toLowerCase()
      );

      if (!matchingHeaderNameOnUserInput) {
        accumulator.push(
          new Mismatch(
            `Missing response header of ${contractHeader.name} on ${endpoint.path}:${endpoint.method}`
          )
        );
        return accumulator;
      }

      const result = this.findMismatchOnContent(
        userInputResponse.headers[matchingHeaderNameOnUserInput],
        contractHeaderType
      );

      if (result.isErr()) {
        accumulator.push(new Mismatch(result.unwrapErr().message));
      } else {
        accumulator.push(...result.unwrap());
      }
      return accumulator;
    }, []);
    return ok(mismatches);
  }

  private getTypeOnContractRequestHeaders(
    endpoint: Endpoint,
    userInputHeaderKey: string
  ): Result<Type, Error> {
    if (!endpoint.request) {
      return err(
        new Error(
          `There is no request defined on ${endpoint.path}:${endpoint.method}`
        )
      );
    }
    for (const header of endpoint.request.headers) {
      if (header.name.toLowerCase() === userInputHeaderKey.toLowerCase()) {
        return ok(header.type);
      }
    }
    return err(
      new Error(
        `No ${userInputHeaderKey} as header is found on ${endpoint.path}:${endpoint.method}`
      )
    );
  }

  private findMismatchOnRequestPathParam(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest
  ): Result<Mismatch[], Error> {
    if (!endpoint.request) {
      return ok([
        new Mismatch(
          `There is no request defined in the contract under path: ${endpoint.path}`
        )
      ]);
    }

    const contractPathArray = endpoint.path.split("/");
    const userPathArray = this.getSeparatedPathFromQueries(
      userInputRequest.path
    )[0].split("/");

    if (contractPathArray.length !== userPathArray.length) {
      return ok([
        new Mismatch(
          `Path parameters passed (${userInputRequest.path}) does not conform to the contract path (${endpoint.path}).`
        )
      ]);
    }
    const mismatches: Mismatch[] = [];
    for (let i = 0; i < contractPathArray.length; i++) {
      if (contractPathArray[i].startsWith(":")) {
        const contractPathParam = endpoint.request!!.pathParams.find(
          param => param.name === contractPathArray[i].substr(1)
        );

        if (!contractPathParam) {
          return err(
            new Error(
              "Unexpected error when trying to find path param key on contract."
            )
          );
        }

        const contractPathParamType = contractPathParam.type;

        const result = this.findMismatchOnContent(
          userPathArray[i],
          contractPathParamType
        );

        if (result.isErr()) {
          return result;
        } else {
          mismatches.push(...result.unwrap());
        }
      }
    }
    return ok(mismatches);
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
    return this.findMismatchOnContent(
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
    return this.findMismatchOnContent(
      userInputResponse.body,
      contractResponseBodyType
    );
  }

  private getArraySerializationStrategy(): { comma: boolean } {
    const comma =
      this.contract.config.paramSerializationStrategy.query.array === "comma";

    return { comma };
  }

  private findMismatchOnRequestQueryParams(
    endpoint: Endpoint,
    userInputRequest: UserInputRequest
  ): Result<Mismatch[], Error> {
    const queryParamsString = url.parse(userInputRequest.path).query || "";
    const contractQueryParams = endpoint.request!!.queryParams;

    const queryParams = qs.parse(queryParamsString, {
      ...this.getArraySerializationStrategy()
    });

    let result;
    let mismatches: Mismatch[] = [];
    for (const {
      name: queryParamName,
      optional,
      type: contractQueryParamType
    } of contractQueryParams) {
      const requestQueryParam = queryParams[queryParamName];

      // Query parameter is mandatory and hasn't been provided
      if (typeof requestQueryParam === "undefined" && !optional) {
        mismatches.push(
          new Mismatch(
            `Query parameter "${queryParamName}" is required but hasn't been provided.`
          )
        );
      }

      if (typeof requestQueryParam === "undefined") {
        continue;
      }

      // Validate current request query param against contract
      result = this.findMismatchOnContent(
        requestQueryParam,
        contractQueryParamType
      );

      queryParams[queryParams] = null;

      if (result.isErr()) {
        return result;
      }

      mismatches.push(...result.unwrap());
    }

    const checkForNonExistingParams = () =>
      Object.entries(queryParams)
        .filter(([_, value]) => value !== null)
        .map(
          ([key, _]) =>
            new Mismatch(
              `Query parameter "${key}" does not exist under the specified endpoint.`
            )
        );

    mismatches = [...mismatches, ...checkForNonExistingParams()];

    return ok(mismatches);
  }

  private findMismatchOnContent(
    content: UserContent,
    contractContentTypeToCheckWith: Type
  ): Result<Mismatch[], Error> {
    if (!content) {
      return ok([]);
    }

    const jsv = new JsonSchemaValidator({ coerceTypes: true });
    const schema = {
      ...generateJsonSchemaType(contractContentTypeToCheckWith),
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
    const valid = validateFn(content);

    if (valid) {
      return ok([]);
    } else {
      if (!validateFn.errors) {
        return err(
          new Error(
            `Body Validation reaches unexpected error for ${content} with contract body ${contractContentTypeToCheckWith}`
          )
        );
      }
      return ok(this.errorObjectMapper(validateFn.errors, content));
    }
  }

  private errorObjectMapper(
    array: ErrorObject[],
    content: UserContent
  ): Mismatch[] {
    return array.map(e => {
      const message = e.message
        ? `${JSON.stringify(content)}: ${e.schemaPath} ${e.message}`
        : `JsonSchemaValidator encountered an unexpected error for ${e.data}.`;
      return new Mismatch(message);
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

  private getResponseHeadersOnContractEndpoint(
    endpoint: Endpoint,
    userInputStatusCode: number
  ): Result<Header[], Error> {
    const relevantResponse = this.getRelevantResponse(
      endpoint,
      userInputStatusCode
    );

    if (relevantResponse.isErr()) {
      return relevantResponse;
    }

    return ok(relevantResponse.unwrap().headers);
  }

  private getResponseBodyTypeOnContractEndpoint(
    endpoint: Endpoint,
    userInputStatusCode: number
  ): Result<Type, Error> {
    const relevantResponse = this.getRelevantResponse(
      endpoint,
      userInputStatusCode
    );

    if (relevantResponse.isErr()) {
      return relevantResponse;
    }

    const responseBody = relevantResponse.unwrap().body;

    if (!responseBody) {
      return err(
        new Error(
          `There is no defined body on response body on ${endpoint.path}:${endpoint.method} with status code ${userInputStatusCode}`
        )
      );
    }
    return ok(responseBody.type);
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
