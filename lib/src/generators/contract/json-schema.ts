import assertNever from "assert-never";
import { ContractDefinition } from "lib/src/models/definitions";
import { DataType, TypeKind } from "../../models/types";
import YAML from "js-yaml";

export function generateJsonSchema(
  contractDefinition: ContractDefinition,
  format: "json" | "yaml"
) {
  const contract = jsonSchema(contractDefinition);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function jsonSchema(contractDefinition: ContractDefinition): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: contractDefinition.types.reduce<{
      [typeName: string]: JsonSchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = jsonTypeSchema(typeNode.type);
      return acc;
    }, {})
  };
}

export function jsonTypeSchema(type: DataType): JsonSchemaType {
  switch (type.kind) {
    case TypeKind.NULL:
      return {
        type: "null"
      };
    case TypeKind.BOOLEAN:
      return {
        type: "boolean"
      };
    case TypeKind.BOOLEAN_LITERAL:
      return {
        type: "boolean",
        const: type.value
      };
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.STRING:
      return {
        type: "string"
      };
    case TypeKind.STRING_LITERAL:
      return {
        type: "string",
        const: type.value
      };
    case TypeKind.NUMBER:
      return {
        type: "number"
      };
    case TypeKind.INTEGER:
      return {
        type: "integer"
      };
    case TypeKind.NUMBER_LITERAL:
      return Math.round(type.value) === type.value
        ? {
            type: "integer",
            const: type.value
          }
        : {
            type: "number",
            const: type.value
          };
    case TypeKind.OBJECT:
      return type.properties.reduce<JsonSchemaObject & { required: string[] }>(
        (acc, property) => {
          if (!property.optional) {
            acc.required.push(property.name);
          }
          acc.properties[property.name] = jsonTypeSchema(property.type);
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
        items: jsonTypeSchema(type.elements)
      };
    case TypeKind.UNION:
      return {
        oneOf: type.types.map(jsonTypeSchema)
      };
    case TypeKind.TYPE_REFERENCE:
      return {
        $ref: `#/definitions/${type.name}`
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
