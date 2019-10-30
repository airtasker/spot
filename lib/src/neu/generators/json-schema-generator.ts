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
  const contract = jsonSchemaOfSpotContract(contractDefinition);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

function jsonSchemaOfSpotContract(contract: Contract): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: contract.types.reduce<{
      [typeName: string]: JsonSchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = generateJsonSchemaType(typeNode.type);
      return acc;
    }, {})
  };
}

/**
 * Generate a JSON Schema type definition. `objectAdditionalProperties` may
 * be used to configure whether additional properties should be allowed on
 * object types. This can be useful for data validation purposes where
 * property validation can be strict or lenient.
 *
 * @param type a contract type
 * @param objectAdditionalProperties whether to allow additional properties for objects
 */
export function generateJsonSchemaType(
  type: Type,
  objectAdditionalProperties: boolean = true // TODO: expose proper configuration object
): JsonSchemaType {
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
          acc.properties[property.name] = generateJsonSchemaType(
            property.type,
            objectAdditionalProperties
          );
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: objectAdditionalProperties
        }
      );
    case TypeKind.ARRAY:
      return {
        type: "array",
        items: generateJsonSchemaType(
          type.elementType,
          objectAdditionalProperties
        )
      };
    case TypeKind.UNION:
      return {
        oneOf: type.types.map(t =>
          generateJsonSchemaType(t, objectAdditionalProperties)
        )
      };
    case TypeKind.REFERENCE:
      return {
        $ref: `#/definitions/${type.name}`
      };
    default:
      throw assertNever(type);
  }
}
