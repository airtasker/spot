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
  ): Result<{ mismatches: Mismatch[]; context: { endpoint: string } }, Error> {
    const mismatches: Mismatch[] = [];

    // Get endpoint
    // Return mismatch if endpoint does not exist on the contract.
    const expectedEndpointResult = this.getEndpointByRequest(userInputRequest);
    if (expectedEndpointResult.isErr()) {
      return ok({
        mismatches: [new Mismatch(expectedEndpointResult.unwrapErr().message)],
        context: {
          endpoint: ""
        }
      });
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
    requestHeaderMismatchesResult.unwrap().forEach(m => {
      switch (m.kind) {
        case MismatchKind.REQUIRED_HEADER_MISSING:
          mismatches.push(
            new Mismatch(`Required request header "${m.header}" missing`)
          );
          return;
        case MismatchKind.UNDEFINED_HEADER:
          mismatches.push(
            new Mismatch(
              `Request header "${m.header}" not defined in contract request headers`
            )
          );
          return;
        case MismatchKind.HEADER_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Request header "${m.header}" type mismatch: ${m.mismatches.join(
                ", "
              )}`
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
          mismatches.push(
            new Mismatch(`Required response header "${m.header}" missing`)
          );
          return;
        case MismatchKind.UNDEFINED_HEADER:
          mismatches.push(
            new Mismatch(
              `Response header "${m.header}" not defined in contract response headers`
            )
          );
          return;
        case MismatchKind.HEADER_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Response header "${m.header}" type mismatch: ${m.mismatches.join(
                ", "
              )}`
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
          mismatches.push(new Mismatch("Request body not defined in contract"));
          return;
        case MismatchKind.BODY_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Request body type mismatch:\n${m.mismatches.join("\n\n")}`
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
          mismatches.push(
            new Mismatch("Response body not defined in contract")
          );
          return;
        case MismatchKind.BODY_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Response body type mismatch:\n${m.mismatches.join("\n\n")}`
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
        case MismatchKind.PATH_PARAM_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Path param "${m.pathParam}" type mismatch: ${m.mismatches.join(
                ", "
              )}`
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
          mismatches.push(
            new Mismatch(`Required query param "${m.queryParam}" missing`)
          );
          return;
        case MismatchKind.UNDEFINED_QUERY_PARAM:
          mismatches.push(
            new Mismatch(
              `Query param "${m.queryParam}" not defined in contract request query params`
            )
          );
          return;
        case MismatchKind.QUERY_PARAM_TYPE_MISMATCH:
          mismatches.push(
            new Mismatch(
              `Query param "${m.queryParam}" type mismatch: ${m.mismatches.join(
                ", "
              )}`
            )
          );
          return;
        default:
          assertNever(m);
      }
    });

    return ok({
      mismatches,
      context: {
        endpoint: expectedEndpoint.name
      }
    });
  }

  private findHeaderMismatches(
    contractHeaders: Header[],
    inputHeaders: UserInputHeader[],
    strict: boolean = false
  ): Result<
    Array<RequiredHeaderMissing | UndefinedHeader | HeaderTypeMismatch>,
    Error
  > {
    const mismatches = [];

    for (const header of contractHeaders) {
      const inputHeader = inputHeaders.find(
        iH => iH.name.toLowerCase() === header.name.toLowerCase()
      );
      if (inputHeader === undefined) {
        if (!header.optional) {
          mismatches.push(new RequiredHeaderMissing(header.name));
        }
        continue;
      }

      const typeMismatches = this.findMismatchOnStringContent(
        { name: inputHeader.name, value: inputHeader.value },
        header.type
      );
      if (typeMismatches.length > 0) {
        mismatches.push(
          new HeaderTypeMismatch(
            header.name,
            typeMismatches.map(mis => mis.message)
          )
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
          mismatches.push(new UndefinedHeader(iH.name));
        });
    }

    return ok(mismatches);
  }

  private findPathParamMismatches(
    contractEndpoint: Endpoint,
    inputPath: string
  ): Result<PathParamTypeMismatch[], Error> {
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
            new PathParamTypeMismatch(
              contractPathParam.name,
              pathParamMismatches.map(mis => mis.message)
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
  ): Result<Array<UndefinedBody | BodyTypeMismatch>, Error> {
    if (contractBody === undefined) {
      if (inputBody === undefined) {
        return ok([]);
      }
      if (strict) {
        return ok([new UndefinedBody()]);
      }
      return ok([]);
    }

    const jsv = new JsonSchemaValidator({
      format: "full",
      verbose: true
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
      return e.message
        ? `${JSON.stringify(inputBody, undefined, 2)}\n${e.dataPath} ${
            e.message
          }`
        : `JsonSchemaValidator encountered an unexpected error for ${e.data}.`;
    });

    if (bodyTypeMismatches.length > 0) {
      return ok([new BodyTypeMismatch(bodyTypeMismatches)]);
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
      RequiredQueryParamMissing | UndefinedQueryParam | QueryParamTypeMismatch
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
        mismatches.push(new RequiredQueryParamMissing(queryParamName));
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
          new QueryParamTypeMismatch(
            queryParamName,
            result.map(mis => mis.message)
          )
        );
      }
    }

    Object.entries(verifiedQueryParams)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key)
      .forEach(key => {
        mismatches.push(new UndefinedQueryParam(key));
      });

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

enum MismatchKind {
  REQUIRED_HEADER_MISSING = "required_header_missing",
  UNDEFINED_HEADER = "undefined_header",
  HEADER_TYPE_MISMATCH = "header_type_mismatch",
  UNDEFINED_BODY = "undefined_body",
  BODY_TYPE_MISMATCH = "body_type_mismatch",
  PATH_PARAM_TYPE_MISMATCH = "path_param_type_mismatch",
  REQUIRED_QUERY_PARAM_MISSING = "required_query_param_missing",
  UNDEFINED_QUERY_PARAM = "undefined_query_param",
  QUERY_PARAM_TYPE_MISMATCH = "query_param_type_mismatch"
}

class RequiredHeaderMissing {
  readonly kind = MismatchKind.REQUIRED_HEADER_MISSING;
  constructor(readonly header: string) {}
}

class UndefinedHeader {
  readonly kind = MismatchKind.UNDEFINED_HEADER;
  constructor(readonly header: string) {}
}

class HeaderTypeMismatch {
  readonly kind = MismatchKind.HEADER_TYPE_MISMATCH;
  constructor(readonly header: string, readonly mismatches: string[]) {}
}

class UndefinedBody {
  readonly kind = MismatchKind.UNDEFINED_BODY;
  constructor() {}
}

class BodyTypeMismatch {
  readonly kind = MismatchKind.BODY_TYPE_MISMATCH;
  constructor(readonly mismatches: string[]) {}
}

class PathParamTypeMismatch {
  readonly kind = MismatchKind.PATH_PARAM_TYPE_MISMATCH;
  constructor(readonly pathParam: string, readonly mismatches: string[]) {}
}

class RequiredQueryParamMissing {
  readonly kind = MismatchKind.REQUIRED_QUERY_PARAM_MISSING;
  constructor(readonly queryParam: string) {}
}

class UndefinedQueryParam {
  readonly kind = MismatchKind.UNDEFINED_QUERY_PARAM;
  constructor(readonly queryParam: string) {}
}

class QueryParamTypeMismatch {
  readonly kind = MismatchKind.QUERY_PARAM_TYPE_MISMATCH;
  constructor(readonly queryParam: string, readonly mismatches: string[]) {}
}
