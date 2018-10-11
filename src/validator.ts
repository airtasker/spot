import assertNever from "assert-never";
import { Api, Type } from "./models";

export function validate(api: Api): Error[] {
  const errors: Error[] = [];
  for (const endpoint of Object.values(api.endpoints)) {
    for (const param of endpoint.params) {
      validateType(api, param.type, errors);
    }
    validateType(api, endpoint.requestType, errors);
    validateType(api, endpoint.responseType, errors);
  }
  for (const type of Object.values(api.types)) {
    validateType(api, type, errors);
  }
  return errors;
}

function validateType(api: Api, type: Type, errors: Error[]): void {
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
        errors.push(
          createError(`Referenced type ${type.typeName} is not defined.`)
        );
      }
      break;
    default:
      throw assertNever(type);
  }
}

export function createError(message: string): Error {
  return {
    kind: "error",
    message
  };
}

export type Error = {
  kind: "error";
  message: string;
};
