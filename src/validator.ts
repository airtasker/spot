import assertNever from "assert-never";
import { Api, Type } from "./models";

export function validate(api: Api): ErrorMessage[] {
  const errors: ErrorMessage[] = [];
  for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
    const pathParameterNames = new Set<string>();
    for (const pathComponent of endpoint.path) {
      switch (pathComponent.kind) {
        case "static":
          // Nothing to check.
          break;
        case "dynamic":
          validateType(api, pathComponent.type, errors);
          if (pathComponent.type.kind === "void") {
            errors.push(
              `${endpointName} does not define a type for path parameter :${
                pathComponent.name
              }`
            );
          }
          if (pathParameterNames.has(pathComponent.name)) {
            errors.push(
              `${endpointName} defines the path parameter :${
                pathComponent.name
              } multiple times`
            );
          }
          pathParameterNames.add(pathComponent.name);
          break;
        default:
          throw assertNever(pathComponent);
      }
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
    validateType(api, endpoint.defaultErrorType, errors);
    for (const customErrorType of Object.values(endpoint.customErrorTypes)) {
      validateType(api, customErrorType, errors);
    }
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
    case "boolean-constant":
    case "string":
    case "string-constant":
    case "number":
    case "integer-constant":
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
    case "union":
      for (const t of type.types) {
        validateType(api, t, errors);
      }
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
