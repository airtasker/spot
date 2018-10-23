import assertNever from "assert-never";
import { Type } from "../../models";
import compact = require("lodash/compact");

export function rejectVoidOpenApi3SchemaType(
  type: Type,
  errorMessage: string
): OpenAPI3SchemaType {
  const schemaType = openApi3Schema(type);
  if (!schemaType) {
    throw new Error(errorMessage);
  }
  return schemaType;
}

export function voidToNullOpenApi3SchemaType(type: Type): OpenAPI3SchemaType {
  const schemaType = openApi3Schema(type);
  if (!schemaType) {
    return {
      type: "null"
    };
  }
  return schemaType;
}

export function openApi3Schema(type: Type): OpenAPI3SchemaType | null {
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
          const schemaType = openApi3Schema(type);
          if (schemaType) {
            acc.properties[name] = schemaType;
          }
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: []
        } as OpenAPI3SchemaTypeObject & { required: string[] }
      );
    case "array":
      const itemsType = openApi3Schema(type.elements);
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
      const types = type.types.map(t => openApi3Schema(t));
      const withoutNullTypes = compact(types);
      if (withoutNullTypes.length !== types.length) {
        throw new Error(`Unsupported void type in union`);
      }
      return {
        oneOf: withoutNullTypes
      };
    case "type-reference":
      return {
        $ref: `#/components/schema/${type.typeName}`
      };
    default:
      throw assertNever(type);
  }
}

export type OpenAPI3SchemaType =
  | OpenAPI3SchemaTypeObject
  | OpenAPI3SchemaTypeArray
  | OpenAPI3SchemaTypeOneOf
  | OpenAPI3SchemaTypeNull
  | OpenAPI3SchemaTypeString
  | OpenAPI3SchemaTypeNumber
  | OpenAPI3SchemaTypeInteger
  | OpenAPI3SchemaTypeBoolean
  | OpenAPI3SchemaTypeReference;

export interface OpenAPI3SchemaTypeObject {
  type: "object";
  properties: {
    [name: string]: OpenAPI3SchemaType;
  };
  required?: string[];
}

export interface OpenAPI3SchemaTypeArray {
  type: "array";
  items: OpenAPI3SchemaType;
}

export interface OpenAPI3SchemaTypeOneOf {
  oneOf: OpenAPI3SchemaType[];
  discriminator?: {
    propertyName: string;
    mapping: {
      [value: string]: OpenAPI3SchemaType;
    };
  };
}

export interface OpenAPI3SchemaTypeNull {
  type: "null";
}

export interface OpenAPI3SchemaTypeString {
  type: "string";
  const?: string;
  enum?: string[];
}

export interface OpenAPI3SchemaTypeNumber {
  type: "number";
  const?: number;
  enum?: number[];
}

export interface OpenAPI3SchemaTypeInteger {
  type: "integer";
  const?: number;
  enum?: number[];
}

export interface OpenAPI3SchemaTypeBoolean {
  type: "boolean";
  const?: boolean;
}

export interface OpenAPI3SchemaTypeReference {
  $ref: string;
}
