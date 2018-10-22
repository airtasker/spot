import assertNever from "assert-never";
import { Type } from "../../models";
import compact = require("lodash/compact");

export function noVoidJsonSchema(
  type: Type,
  errorMessage: string
): JsonSchemaType {
  const jsonSchemaType = jsonSchema(type);
  if (!jsonSchemaType) {
    throw new Error(errorMessage);
  }
  return jsonSchemaType;
}

export function voidToNullJsonSchema(type: Type): JsonSchemaType {
  const jsonSchemaType = jsonSchema(type);
  if (!jsonSchemaType) {
    return {
      type: "null"
    };
  }
  return jsonSchemaType;
}

export function jsonSchema(type: Type): JsonSchemaType | null {
  switch (type.kind) {
    case "void":
      return null;
    case "null":
      return {
        type: "null"
      };
    case "boolean":
      return {
        type: "boolean"
      };
    case "boolean-constant":
      return {
        type: "boolean",
        const: type.value
      };
    case "string":
      return {
        type: "string"
      };
    case "string-constant":
      return {
        type: "string",
        const: type.value
      };
    case "number":
      return {
        type: "number"
      };
    case "integer-constant":
      return {
        type: "integer",
        const: type.value
      };
    case "object":
      return Object.entries(type.properties).reduce(
        (acc, [name, type]) => {
          if (type.kind === "optional") {
            type = type.optional;
          } else {
            acc.required.push(name);
          }
          const jsonSchemaType = jsonSchema(type);
          if (jsonSchemaType) {
            acc.properties[name] = jsonSchemaType;
          }
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: []
        } as JsonSchemaObject & { required: string[] }
      );
    case "array":
      const itemsType = jsonSchema(type.elements);
      if (!itemsType) {
        throw new Error(`Unsupported void array`);
      }
      return {
        type: "array",
        items: itemsType
      };
    case "optional":
      throw new Error(`Unsupported top-level optional type`);
    case "union":
      const types = type.types.map(jsonSchema);
      const withoutNullTypes = compact(types);
      if (withoutNullTypes.length !== types.length) {
        throw new Error(`Unsupported void type in union`);
      }
      return {
        oneOf: withoutNullTypes
      };
    case "type-reference":
      return {
        $ref: type.typeName
      };
    default:
      throw assertNever(type);
  }
}

export type JsonSchemaType =
  | JsonSchemaObject
  | JsonSchemaArray
  | JsonSchemaOneOf
  | JsonSchemaNull
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaInteger
  | JsonSchemaBoolean
  | JsonSchemaTypeReference;

export interface JsonSchemaObject {
  type: "object";
  properties: {
    [name: string]: JsonSchemaType;
  };
  required?: string[];
}

export interface JsonSchemaArray {
  type: "array";
  items: JsonSchemaType;
}

export interface JsonSchemaOneOf {
  oneOf: JsonSchemaType[];
  discriminator?: {
    propertyName: string;
    mapping: {
      [value: string]: JsonSchemaType;
    };
  };
}

export interface JsonSchemaNull {
  type: "null";
}

export interface JsonSchemaString {
  type: "string";
  const?: string;
  enum?: string[];
}

export interface JsonSchemaNumber {
  type: "number";
  const?: number;
  enum?: number[];
}

export interface JsonSchemaInteger {
  type: "integer";
  const?: number;
  enum?: number[];
}

export interface JsonSchemaBoolean {
  type: "boolean";
  const?: boolean;
}

export interface JsonSchemaTypeReference {
  $ref: string;
}
