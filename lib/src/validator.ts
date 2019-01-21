import assertNever from "assert-never";
import uniq from "lodash/uniq";
import { Api, Type, VOID } from "./models";

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
          ensureStringOrNumber(
            api,
            pathComponent.type,
            pathComponent.name,
            errors
          );
          if (isVoid(api, pathComponent.type)) {
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
    if (endpoint.method === "GET" && !isVoid(api, endpoint.requestType)) {
      errors.push(
        `${endpointName} cannot have a request body because its HTTP method is ${
          endpoint.method
        }`
      );
    }
    const usedHeaderFieldNames = new Set<string>();
    for (const [headerName, header] of Object.entries(endpoint.headers)) {
      validateType(api, header.type, errors);
      ensureOptionalOrRequiredString(api, header.type, headerName, errors);
      if (usedHeaderFieldNames.has(header.headerFieldName)) {
        errors.push(
          `${endpointName} defines the same header ${
            header.headerFieldName
          } multiple times`
        );
      }
      usedHeaderFieldNames.add(header.headerFieldName);
    }
    const queryParameterNames = new Set<string>();
    for (const queryComponent of endpoint.queryParams) {
      validateType(api, queryComponent.type, errors);
      if (isVoid(api, queryComponent.type)) {
        errors.push(
          `${endpointName} does not define a type for query parameter '${
            queryComponent.name
          }'`
        );
      }
      if (queryParameterNames.has(queryComponent.name)) {
        errors.push(
          `${endpointName} defines the query parameter '${
            queryComponent.name
          }' multiple times`
        );
      }
      queryParameterNames.add(queryComponent.name);
    }
    validateType(api, endpoint.requestType, errors);
    validateType(api, endpoint.responseType, errors);
    validateType(api, endpoint.genericErrorType, errors);
    for (const specificError of Object.values(endpoint.specificErrorTypes)) {
      validateType(api, specificError.type, errors);
    }
  }
  for (const type of Object.values(api.types)) {
    validateType(api, type, errors);
  }
  return uniq(errors);
}

function validateType(api: Api, type: Type, errors: ErrorMessage[]): void {
  switch (type.kind) {
    case "void":
    case "null":
    case "boolean":
    case "boolean-constant":
    case "date":
    case "date-time":
    case "string":
    case "string-constant":
    case "number":
    case "integer-constant":
    case "int32":
    case "int64":
    case "float":
    case "double":
      break;
    case "object":
      for (const property of Object.values(type.properties)) {
        validateType(api, property, errors);
      }
      for (const extended of Object.values(type.extends)) {
        validateType(api, extended, errors);
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

function ensureStringOrNumber(
  api: Api,
  type: Type,
  parameterName: string,
  errors: ErrorMessage[]
): void {
  switch (type.kind) {
    case "string":
    case "string-constant":
    case "number":
    case "integer-constant":
    case "int32":
    case "int64":
    case "float":
    case "double":
      // That's fine.
      return;
    case "type-reference":
      ensureStringOrNumber(
        api,
        api.types[type.typeName] || VOID,
        parameterName,
        errors
      );
      break;
    case "union":
      type.types.forEach(possibleType =>
        ensureStringOrNumber(api, possibleType, parameterName, errors)
      );
      break;
    default:
      // That's not fine.
      errors.push(`Parameter ${parameterName} must be a string or a number`);
  }
}

function ensureOptionalOrRequiredString(
  api: Api,
  type: Type,
  parameterName: string,
  errors: ErrorMessage[]
): void {
  switch (type.kind) {
    case "string":
    case "string-constant":
      // That's fine.
      return;
    case "type-reference":
      ensureOptionalOrRequiredString(
        api,
        api.types[type.typeName] || VOID,
        parameterName,
        errors
      );
      break;
    case "optional":
      ensureOptionalOrRequiredString(api, type.optional, parameterName, errors);
      break;
    case "union":
      type.types.forEach(possibleType =>
        ensureOptionalOrRequiredString(api, possibleType, parameterName, errors)
      );
      break;
    default:
      // That's not fine.
      errors.push(
        `Parameter ${parameterName} must be a string (either required or optional)`
      );
  }
}

export type ErrorMessage = string;

export function isVoid(api: Api, type: Type): boolean {
  switch (type.kind) {
    case "void":
      return true;
    case "type-reference":
      return api.types[type.typeName] && isVoid(api, api.types[type.typeName]);
    case "union":
      return type.types.reduce((acc, t) => acc && isVoid(api, t), true);
    case "optional":
      return isVoid(api, type.optional);
    default:
      return false;
  }
}
