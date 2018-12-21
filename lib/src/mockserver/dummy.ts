import { generate as generateRandomString } from "randomstring";
import assertNever from "../assert-never";
import { normalizedObjectType, Type, Types } from "../models";

/**
 * Generates dummy data based on a type.
 */
export function generateData(types: Types, type: Type): any {
  switch (type.kind) {
    case "void":
      return undefined;
    case "null":
      return null;
    case "boolean":
      return randomBoolean();
    case "boolean-constant":
      return type.value;
    case "string":
      return generateRandomString();
    case "string-constant":
      return type.value;
    case "number":
    case "int32":
    case "int64":
      return randomInteger(100);
    case "float":
    case "double":
      return randomDouble(100);
    case "date":
    case "date-time":
      return new Date().toISOString();
    case "integer-constant":
      return type.value;
    case "object":
      return Object.entries(normalizedObjectType(types, type)).reduce(
        (acc, [key, propertyType]) => {
          acc[key] = generateData(types, propertyType);
          return acc;
        },
        {} as { [key: string]: any }
      );
    case "array":
      const size = randomInteger(10);
      const array: any[] = [];
      for (let i = 0; i < size; i++) {
        array.push(generateData(types, type.elements));
      }
      return array;
    case "optional":
      return randomBoolean() ? generateData(types, type.optional) : undefined;
    case "union":
      return generateData(
        types,
        type.types[randomInteger(type.types.length - 1)]
      );
    case "type-reference":
      return generateData(types, types[type.typeName]);
    default:
      throw assertNever(type);
  }
}

function randomBoolean() {
  return Math.random() > 0.5;
}

function randomInteger(max: number) {
  return Math.round(randomDouble(max));
}

function randomDouble(max: number) {
  return Math.random() * max;
}
