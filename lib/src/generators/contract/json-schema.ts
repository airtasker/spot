import assertNever from "assert-never";
import * as YAML from "js-yaml";
import { Api, normalizedObjectType, Type, Types } from "../../models";
import compact = require("lodash/compact");

export function generateJsonSchema(api: Api, format: "json" | "yaml") {
  const contract = jsonSchema(api);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function jsonSchema(api: Api): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: Object.entries(api.types).reduce(
      (acc, [typeName, type]) => {
        acc[typeName] = jsonTypeSchema(api.types, type);
        return acc;
      },
      {} as { [typeName: string]: JsonSchemaType }
    )
  };
}

export function jsonTypeSchema(types: Types, type: Type): JsonSchemaType {
  switch (type.kind) {
    case "void":
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
    case "date":
    case "date-time":
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
    case "int32":
    case "int64":
    case "float":
    case "double":
      return {
        type: "number"
      };
    case "integer-constant":
      return {
        type: "integer",
        const: type.value
      };
    case "object":
      return Object.entries(normalizedObjectType(types, type)).reduce(
        (acc, [name, type]) => {
          if (type.kind === "optional") {
            type = type.optional;
          } else {
            acc.required.push(name);
          }
          const schemaType = jsonTypeSchema(types, type);
          if (schemaType) {
            acc.properties[name] = schemaType;
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
      const itemsType = jsonTypeSchema(types, type.elements);
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
      const unionTypes = type.types.map(t => jsonTypeSchema(types, t));
      const withoutNullTypes = compact(unionTypes);
      if (withoutNullTypes.length !== unionTypes.length) {
        throw new Error(`Unsupported void type in union`);
      }
      return {
        oneOf: withoutNullTypes
      };
    case "type-reference":
      return {
        $ref: `#/definitions/${type.typeName}`
      };
    default:
      throw assertNever(type);
  }
}

export interface JsonSchema {
  $schema: "http://json-schema.org/draft-07/schema#";
  definitions: {
    [typeName: string]: JsonSchemaType;
  };
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
