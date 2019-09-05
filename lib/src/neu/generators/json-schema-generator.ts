import assertNever from "assert-never";
import YAML from "js-yaml";
import { Contract } from "../definitions";
import {
  JsonSchema,
  JsonSchemaObject,
  JsonSchemaType
} from "../schemas/json-schema";
import { Type, TypeKind } from "../types";

export function generateJsonSchema(
  contractDefinition: Contract,
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

export function jsonSchema(contract: Contract): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: contract.types.reduce<{
      [typeName: string]: JsonSchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = jsonTypeSchema(typeNode.type);
      return acc;
    }, {})
  };
}

export function jsonTypeSchema(type: Type): JsonSchemaType {
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
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
      return {
        type: "number"
      };
    case TypeKind.FLOAT_LITERAL:
      return {
        type: "number",
        const: type.value
      };
    case TypeKind.INT32:
    case TypeKind.INT64:
      return {
        type: "integer"
      };
    case TypeKind.INT_LITERAL:
      return {
        type: "integer",
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
        items: jsonTypeSchema(type.elementType)
      };
    case TypeKind.UNION:
      return {
        oneOf: type.types.map(jsonTypeSchema)
      };
    case TypeKind.REFERENCE:
      return {
        $ref: `#/definitions/${type.name}`
      };
    default:
      throw assertNever(type);
  }
}
