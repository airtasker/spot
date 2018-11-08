import assertNever from "../../assert-never";
import { Type } from "../../models";
import compact = require("lodash/compact");

export function rejectVoidOpenApi2SchemaType(
  type: Type,
  errorMessage: string
): OpenAPI2SchemaType {
  const schemaType = openApi2TypeSchema(type);
  if (!schemaType) {
    throw new Error(errorMessage);
  }
  return schemaType;
}

export function openApi2TypeSchema(type: Type): OpenAPI2SchemaType | null {
  switch (type.kind) {
    case "void":
      return null;
    case "null":
      return null;
    case "boolean":
      return {
        type: "boolean"
      };
    case "boolean-constant":
      return {
        type: "boolean",
        enum: [type.value]
      };
    case "string":
      return {
        type: "string"
      };
    case "string-constant":
      return {
        type: "string",
        enum: [type.value]
      };
    case "number":
      return {
        type: "number"
      };
    case "integer-constant":
      return {
        type: "integer",
        enum: [type.value]
      };
    case "object":
      return Object.entries(type.properties).reduce(
        (acc, [name, type]) => {
          if (type.kind === "optional") {
            type = type.optional;
          } else {
            acc.required.push(name);
          }
          const schemaType = openApi2TypeSchema(type);
          if (schemaType) {
            acc.properties[name] = schemaType;
          }
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: []
        } as OpenAPI2SchemaTypeObject & { required: string[] }
      );
    case "array":
      const itemsType = openApi2TypeSchema(type.elements);
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
      const types = type.types.map(t => openApi2TypeSchema(t));
      const withoutNullTypes = compact(types);
      if (withoutNullTypes.length !== types.length) {
        throw new Error(`Unsupported void type in union`);
      }
      return {
        allOf: withoutNullTypes
      };
    case "type-reference":
      return {
        $ref: `#/definitions/${type.typeName}`
      };
    default:
      throw assertNever(type);
  }
}

export type OpenAPI2SchemaType =
  | OpenAPI2SchemaTypeObject
  | OpenAPI2SchemaTypeArray
  | OpenAPI2SchemaTypeAllOf
  | OpenAPI2SchemaTypeNull
  | OpenAPI2SchemaTypeString
  | OpenAPI2SchemaTypeNumber
  | OpenAPI2SchemaTypeInteger
  | OpenAPI2SchemaTypeBoolean
  | OpenAPI2SchemaTypeReference;

export interface OpenAPI2BaseSchemaType {
  discriminator?: {
    propertyName: string;
    mapping: {
      [value: string]: OpenAPI2SchemaType;
    };
  };
}

export interface OpenAPI2SchemaTypeObject extends OpenAPI2BaseSchemaType {
  type: "object";
  properties: {
    [name: string]: OpenAPI2SchemaType;
  };
  required?: string[];
}

export interface OpenAPI2SchemaTypeArray extends OpenAPI2BaseSchemaType {
  type: "array";
  items: OpenAPI2SchemaType;
}

export interface OpenAPI2SchemaTypeAllOf extends OpenAPI2BaseSchemaType {
  allOf: OpenAPI2SchemaType[];
}

export interface OpenAPI2SchemaTypeNull extends OpenAPI2BaseSchemaType {}

export interface OpenAPI2SchemaTypeString extends OpenAPI2BaseSchemaType {
  type: "string";
  enum?: string[];
}

export interface OpenAPI2SchemaTypeNumber extends OpenAPI2BaseSchemaType {
  type: "number";
  enum?: number[];
}

export interface OpenAPI2SchemaTypeInteger extends OpenAPI2BaseSchemaType {
  type: "integer";
  enum?: number[];
}

export interface OpenAPI2SchemaTypeBoolean extends OpenAPI2BaseSchemaType {
  type: "boolean";
  enum?: boolean[];
}

export interface OpenAPI2SchemaTypeReference extends OpenAPI2BaseSchemaType {
  $ref: string;
}
