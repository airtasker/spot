import assertNever from "assert-never";
import { Type } from "../../models";
import compact = require("lodash/compact");

export function noVoidJsonSchema(
  flavour: Flavour,
  type: Type,
  errorMessage: string
): JsonSchemaType {
  const jsonSchemaType = jsonSchema(flavour, type);
  if (!jsonSchemaType) {
    throw new Error(errorMessage);
  }
  return jsonSchemaType;
}

export function voidToNullJsonSchema(
  flavour: Flavour,
  type: Type
): JsonSchemaType {
  const jsonSchemaType = jsonSchema(flavour, type);
  if (!jsonSchemaType) {
    return {
      type: "null"
    };
  }
  return jsonSchemaType;
}

export type Flavour = "json-schema-draft-7" | "openapi-3";

export const FLAVOURS: Flavour[] = ["json-schema-draft-7", "openapi-3"];

export function jsonSchema(
  flavour: Flavour,
  type: Type
): JsonSchemaType | null {
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
          const jsonSchemaType = jsonSchema(flavour, type);
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
      const itemsType = jsonSchema(flavour, type.elements);
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
      const types = type.types.map(t => jsonSchema(flavour, t));
      const withoutNullTypes = compact(types);
      if (withoutNullTypes.length !== types.length) {
        throw new Error(`Unsupported void type in union`);
      }
      return {
        oneOf: withoutNullTypes
      };
    case "type-reference":
      switch (flavour) {
        case "json-schema-draft-7":
          return {
            $ref: `#/definitions/${type.typeName}`
          };
        case "openapi-3":
          return {
            $ref: `#/components/schemas/${type.typeName}`
          };
        default:
          throw assertNever(flavour);
      }
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
