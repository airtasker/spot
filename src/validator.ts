import assertNever from "assert-never";
import { Api, Type } from "./models";

const PREFIXED_PARAM_NAME = /:[a-z]+/gi;

export function validate(api: Api): ErrorMessage[] {
  const errors: ErrorMessage[] = [];
  for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
    const matches = endpoint.path.match(PREFIXED_PARAM_NAME);
    const expectedPathParamNames = new Set(
      matches ? matches.map(m => m.substr(1)) : []
    );
    const definedPathParamNames = new Set<string>();
    for (const param of endpoint.pathParameters) {
      definedPathParamNames.add(param.name);
      validateType(api, param.type, errors);
    }
    const missingPathParamNames = new Set(
      [...expectedPathParamNames].filter(x => !definedPathParamNames.has(x))
    );
    const extraneousPathParamNames = new Set(
      [...definedPathParamNames].filter(x => !expectedPathParamNames.has(x))
    );
    for (const paramName of missingPathParamNames) {
      errors.push(
        `${endpointName} does not define a type for path parameter :${paramName}`
      );
    }
    for (const paramName of extraneousPathParamNames) {
      errors.push(
        `${endpointName} does not have a parameter named :${paramName} in its path`
      );
    }
    if (endpoint.method === "GET" && endpoint.requestType.kind !== "void") {
      errors.push(
        `${endpointName} cannot have a request body because its HTTP method is ${
          endpoint.method
        }`
      );
    }
    validateType(api, endpoint.requestType, errors);
    validateType(api, endpoint.responseType, errors);
  }
  for (const type of Object.values(api.types)) {
    validateType(api, type, errors);
  }
  return errors;
}

function validateType(api: Api, type: Type, errors: ErrorMessage[]): void {
  switch (type.kind) {
    case "void":
    case "null":
    case "boolean":
    case "string":
    case "number":
      break;
    case "object":
      for (const property of Object.values(type.properties)) {
        validateType(api, property, errors);
      }
      break;
    case "array":
      validateType(api, type.elements, errors);
      break;
    case "optional":
      validateType(api, type.optional, errors);
      break;
    case "type-reference":
      if (!api.types[type.typeName]) {
        errors.push(`Referenced type ${type.typeName} is not defined`);
      }
      break;
    default:
      throw assertNever(type);
  }
}

export type ErrorMessage = string;
