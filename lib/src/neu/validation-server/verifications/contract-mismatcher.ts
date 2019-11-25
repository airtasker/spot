import JsonSchemaValidator from "ajv";
import assertNever from "assert-never";
import qs from "qs";
import * as url from "url";
import {
  Body,
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  Response
} from "../../definitions";
import { generateJsonSchemaType } from "../../generators/json-schema-generator";
import { JsonSchemaType } from "../../schemas/json-schema";
import { Type, TypeTable } from "../../types";
import { err, ok, Result } from "../../util";
import { Violation } from "../spots/validate";
import {
  BodyTypeDisparityMismatch,
  bodyTypeDisparityMismatch,
  HeaderTypeDisparityMismatch,
  headerTypeDisparityMismatch,
  MismatchKind,
  PathParamTypeDisparityMismatch,
  pathParamTypeDisparityMismatch,
  QueryParamTypeDisparityMismatch,
  queryParamTypeDisparityMismatch,
  RequiredHeaderMissingMismatch,
  requiredHeaderMissingMismatch,
  RequiredQueryParamMissingMismatch,
  requiredQueryParamMissingMismatch,
  UndefinedBodyMismatch,
  undefinedBodyMismatch,
  UndefinedHeaderMismatch,
  undefinedHeaderMismatch,
  UndefinedQueryParamMismatch,
  undefinedQueryParamMismatch
} from "./mismatches";
import { StringInput, StringValidator } from "./string-validator";
import {
  UserInputBody,
  UserInputHeader,
  UserInputRequest,
  UserInputResponse
} from "./user-input-models";
import {
  pathParamTypeDisparityViolation,
  queryParamTypeDisparityViolation,
  requestBodyTypeDisparityViolation,
  requestHeaderTypeDisparityViolation,
  requiredQueryParamMissingViolation,
  requiredRequestHeaderMissingViolation,
  requiredResponseHeaderMissingViolation,
  responseBodyTypeDisparityViolation,
  responseHeaderTypeDisparityViolation,
  undefinedEndpointResponseViolation,
  undefinedEndpointViolation,
  undefinedQueryParamViolation,
  undefinedRequestBodyViolation,
  undefinedRequestHeaderViolation,
  undefinedResponseBodyViolation,
  undefinedResponseHeaderViolation
} from "./violations";

export class ContractMismatcher {
  private typeTable: TypeTable;

  constructor(private readonly contract: Contract) {
    this.typeTable = TypeTable.fromArray(this.contract.types);
  }

  findViolations(
    userInputRequest: UserInputRequest,
    userInputResponse: UserInputResponse
  ): Result<{ violations: Violation[]; context: { endpoint: string } }, Error> {
    const violations: Violation[] = [];

    // Get endpoint
    // Return violation if endpoint does not exist on the contract
    const expectedEndpointResult = this.getEndpointByRequest(userInputRequest);
    if (expectedEndpointResult.isErr()) {
      return ok({
        violations: [
          undefinedEndpointViolation(expectedEndpointResult.unwrapErr().message)
        ],
        context: { endpoint: "" }
      });
    }
    const expectedEndpoint = expectedEndpointResult.unwrap();

    // Get request
    const expectedRequest = expectedEndpoint.request;

    // Get response
    // Return violation if endpoint response does not exist on the contract
    const expectedResponseResult = this.getRelevantResponse(
      expectedEndpoint,
      userInputResponse.statusCode
    );
    if (expectedResponseResult.isErr()) {
      return ok({
        violations: [
          undefinedEndpointResponseViolation(
            expectedResponseResult.unwrapErr().message
          )
        ],
        context: { endpoint: expectedEndpoint.name }
      });
    }
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
    requestHeaderMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.REQUIRED_HEADER_MISSING:
          violations.push(
            requiredRequestHeaderMissingViolation(
              `Required request header "${m.header}" missing`
            )
          );
          return;
        case MismatchKind.UNDEFINED_HEADER:
          violations.push(
            undefinedRequestHeaderViolation(
              `Request header "${m.header}" not defined in contract request headers`
            )
          );
          return;
        case MismatchKind.HEADER_TYPE_DISPARITY:
          violations.push(
            requestHeaderTypeDisparityViolation(
              `Request header "${
                m.header
              }" type disparity: ${m.typeDisparities.join(", ")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    // Find response header mismatches
    const responseHeaderMismatchesResult = this.findHeaderMismatches(
      expectedResponse.headers,
      userInputResponse.headers
    );
    if (responseHeaderMismatchesResult.isErr()) {
      return responseHeaderMismatchesResult;
    }
    responseHeaderMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.REQUIRED_HEADER_MISSING:
          violations.push(
            requiredResponseHeaderMissingViolation(
              `Required response header "${m.header}" missing`
            )
          );
          return;
        case MismatchKind.UNDEFINED_HEADER:
          violations.push(
            undefinedResponseHeaderViolation(
              `Response header "${m.header}" not defined in contract response headers`
            )
          );
          return;
        case MismatchKind.HEADER_TYPE_DISPARITY:
          violations.push(
            responseHeaderTypeDisparityViolation(
              `Response header "${
                m.header
              }" type disparity: ${m.typeDisparities.join(", ")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    // Find request body mismatches
    const requestBodyMismatchesResult = this.findBodyMismatches(
      expectedRequest && expectedRequest.body,
      userInputRequest.body,
      true
    );
    if (requestBodyMismatchesResult.isErr()) {
      return requestBodyMismatchesResult;
    }
    requestBodyMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.UNDEFINED_BODY:
          violations.push(
            undefinedRequestBodyViolation(
              "Request body not defined in contract"
            )
          );
          return;
        case MismatchKind.BODY_TYPE_DISPARITY:
          violations.push(
            requestBodyTypeDisparityViolation(
              `Request body type disparity:\n${m.data}\n${m.typeDisparities
                .map(disp => `- ${disp}`)
                .join("\n")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    // Find response body mismatches
    const responseBodyMismatchesResult = this.findBodyMismatches(
      expectedResponse.body,
      userInputResponse.body
    );
    if (responseBodyMismatchesResult.isErr()) {
      return responseBodyMismatchesResult;
    }
    responseBodyMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.UNDEFINED_BODY:
          violations.push(
            undefinedResponseBodyViolation(
              "Response body not defined in contract"
            )
          );
          return;
        case MismatchKind.BODY_TYPE_DISPARITY:
          violations.push(
            responseBodyTypeDisparityViolation(
              `Response body type disparity:\n${
                m.data
              }\n${m.typeDisparities.map(disp => `- ${disp}`).join("\n")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    // Find path parameter mismatches
    const pathParamMismatchesResult = this.findPathParamMismatches(
      expectedEndpoint,
      userInputRequest.path
    );
    if (pathParamMismatchesResult.isErr()) {
      return pathParamMismatchesResult;
    }
    pathParamMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.PATH_PARAM_TYPE_DISPARITY:
          violations.push(
            pathParamTypeDisparityViolation(
              `Path param "${
                m.pathParam
              }" type disparity: ${m.typeDisparities.join(", ")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m.kind);
      }
    });

    // Find query parameter mismatches
    const queryParamMismatchesResult = this.findQueryParamMismatches(
      expectedEndpoint,
      userInputRequest.path
    );
    if (queryParamMismatchesResult.isErr()) {
      return queryParamMismatchesResult;
    }
    queryParamMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.REQUIRED_QUERY_PARAM_MISSING:
          violations.push(
            requiredQueryParamMissingViolation(
              `Required query param "${m.queryParam}" missing`
            )
          );
          return;
        case MismatchKind.UNDEFINED_QUERY_PARAM:
          violations.push(
            undefinedQueryParamViolation(
              `Query param "${m.queryParam}" not defined in contract request query params`
            )
          );
          return;
        case MismatchKind.QUERY_PARAM_TYPE_DISPARITY:
          violations.push(
            queryParamTypeDisparityViolation(
              `Query param "${
                m.queryParam
              }" type disparity: ${m.typeDisparities.join(", ")}`,
              m.typeDisparities
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    return ok({ violations, context: { endpoint: expectedEndpoint.name } });
  }

  private findHeaderMismatches(
    contractHeaders: Header[],
    inputHeaders: UserInputHeader[],
    strict: boolean = false
  ): Result<
    Array<
      | RequiredHeaderMissingMismatch
      | UndefinedHeaderMismatch
      | HeaderTypeDisparityMismatch
    >,
    Error
  > {
    const mismatches = [];

    for (const header of contractHeaders) {
      const inputHeader = inputHeaders.find(
        iH => iH.name.toLowerCase() === header.name.toLowerCase()
      );
      if (inputHeader === undefined) {
        if (!header.optional) {
          mismatches.push(requiredHeaderMissingMismatch(header.name));
        }
        continue;
      }

      const typeMismatches = this.findMismatchOnStringContent(
        { name: inputHeader.name, value: inputHeader.value },
        header.type
      );
      if (typeMismatches.length > 0) {
        mismatches.push(
          headerTypeDisparityMismatch(header.name, typeMismatches)
        );
      }
    }

    if (strict) {
      inputHeaders
        .filter(
          iH =>
            !contractHeaders.some(
              header => header.name.toLowerCase() === iH.name.toLowerCase()
            )
        )
        .forEach(iH => {
          mismatches.push(undefinedHeaderMismatch(iH.name));
        });
    }

    return ok(mismatches);
  }

  private findPathParamMismatches(
    contractEndpoint: Endpoint,
    inputPath: string
  ): Result<PathParamTypeDisparityMismatch[], Error> {
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

    const mismatches = [];
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
        if (pathParamMismatches.length > 0) {
          mismatches.push(
            pathParamTypeDisparityMismatch(
              contractPathParam.name,
              pathParamMismatches
            )
          );
        }
      }
    }
    return ok(mismatches);
  }

  private findBodyMismatches(
    contractBody: Body | undefined,
    inputBody: UserInputBody,
    strict: boolean = false
  ): Result<Array<UndefinedBodyMismatch | BodyTypeDisparityMismatch>, Error> {
    if (contractBody === undefined) {
      if (inputBody === undefined) {
        return ok([]);
      }
      if (strict) {
        return ok([undefinedBodyMismatch()]);
      }
      return ok([]);
    }

    const jsv = new JsonSchemaValidator({
      format: "full",
      verbose: true,
      allErrors: true
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

    const bodyTypeMismatches = validateFn.errors.map(e => {
      return `#${e.dataPath} ${e.message ||
        "JsonSchemaValidator encountered an unexpected error"}`;
    });

    if (bodyTypeMismatches.length > 0) {
      return ok([
        bodyTypeDisparityMismatch(
          JSON.stringify(inputBody, undefined, 2),
          bodyTypeMismatches
        )
      ]);
    }

    return ok([]);
  }

  private getQueryParamsArraySerializationStrategy(): { comma: boolean } {
    const comma =
      this.contract.config.paramSerializationStrategy.query.array === "comma";

    return { comma };
  }

  private findQueryParamMismatches(
    contractEndpoint: Endpoint,
    inputPath: string
  ): Result<
    Array<
      | RequiredQueryParamMissingMismatch
      | UndefinedQueryParamMismatch
      | QueryParamTypeDisparityMismatch
    >,
    Error
  > {
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

    const mismatches = [];
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
        mismatches.push(requiredQueryParamMissingMismatch(queryParamName));
        continue;
      }

      // Mark query param as verified
      verifiedQueryParams[queryParamName] = true;

      // Validate current request query param against contract
      const result = this.findMismatchOnStringContent(
        { name: queryParamName, value: requestQueryParam },
        contractQueryParamType
      );

      if (result.length > 0) {
        mismatches.push(
          queryParamTypeDisparityMismatch(queryParamName, result)
        );
      }
    }

    Object.entries(verifiedQueryParams)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)
      .forEach(key => {
        mismatches.push(undefinedQueryParamMismatch(key));
      });

    return ok(mismatches);
  }

  private findMismatchOnStringContent(
    content: StringInput,
    contractContentTypeToCheckWith: Type
  ): string[] {
    const stringValidator = new StringValidator(this.typeTable);

    const valid = stringValidator.run(content, contractContentTypeToCheckWith);

    if (valid) {
      return [];
    }
    return stringValidator.messages;
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
