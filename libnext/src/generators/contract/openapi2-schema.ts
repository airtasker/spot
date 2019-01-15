import assertNever from "assert-never";
import { DataType, TypeKind, UnionType } from "../../models/types";
import compact = require("lodash/compact");

function isStringConstantUnion(type: UnionType): boolean {
  return type.types.reduce((acc, type) => {
    return acc && type.kind === TypeKind.STRING_LITERAL;
  }, true);
}

export function openApi2TypeSchema(type: DataType): OpenAPI2SchemaType | null {
  switch (type.kind) {
    case TypeKind.NULL:
      return null;
    case TypeKind.BOOLEAN:
      return {
        type: "boolean"
      };
    case TypeKind.BOOLEAN_LITERAL:
      return {
        type: "boolean",
        enum: [type.value]
      };
    case TypeKind.DATE:
      return {
        type: "string",
        format: "date"
      };
    case TypeKind.DATE_TIME:
      return {
        type: "string",
        format: "date-time"
      };
    case TypeKind.STRING:
      return {
        type: "string"
      };
    case TypeKind.STRING_LITERAL:
      return {
        type: "string",
        enum: [type.value]
      };
    case TypeKind.NUMBER:
      return {
        type: "number"
      };
    case TypeKind.NUMBER_LITERAL:
      return Math.round(type.value) === type.value
        ? {
            type: "integer",
            enum: [type.value]
          }
        : {
            type: "number",
            enum: [type.value]
          };
    case TypeKind.INTEGER:
      return {
        type: "integer",
        format: "int32"
      };
    case TypeKind.OBJECT:
      return type.properties.reduce<
        OpenAPI2SchemaTypeObject & { required: string[] }
      >(
        (acc, property) => {
          if (!property.optional) {
            acc.required.push(name);
          }
          acc.properties[name] = openApi2TypeSchema(type);
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: []
        }
      );
    case TypeKind.ARRAY:
      return {
        type: "array",
        items: openApi2TypeSchema(type.elements)
      };
    case TypeKind.UNION:
      if (isStringConstantUnion(type)) {
        return {
          type: "string",
          enum: compact(
            type.types.map(
              t => (t.kind === TypeKind.STRING_LITERAL ? t.value : null)
            )
          )
        };
      }
      // Please have a look at https://github.com/OAI/OpenAPI-Specification/issues/333
      throw new Error(`Unions are not supported in OpenAPI 2`);
    case TypeKind.TYPE_REFERENCE:
      return {
        $ref: `#/definitions/${type.name}`
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
  | OpenAPI2SchemaTypeDateTime
  | OpenAPI2SchemaTypeNumber
  | OpenAPI2SchemaTypeInt
  | OpenAPI2SchemaTypeFloatDouble
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

export interface OpenAPI2SchemaTypeDateTime extends OpenAPI2BaseSchemaType {
  type: "string";
  format: "date" | "date-time";
}

export interface OpenAPI2SchemaTypeInt extends OpenAPI2BaseSchemaType {
  type: "integer";
  format: "int32" | "int64";
}

export interface OpenAPI2SchemaTypeFloatDouble extends OpenAPI2BaseSchemaType {
  type: "number";
  format: "float" | "double";
}

export interface OpenAPI2SchemaTypeBoolean extends OpenAPI2BaseSchemaType {
  type: "boolean";
  enum?: boolean[];
}

export interface OpenAPI2SchemaTypeReference extends OpenAPI2BaseSchemaType {
  $ref: string;
}
