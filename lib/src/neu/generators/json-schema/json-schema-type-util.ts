import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  isBooleanLiteralType,
  isFloatLiteralType,
  isIntLiteralType,
  isNotLiteralType,
  isStringLiteralType,
  Type,
  TypeKind
} from "../../types";
import { JsonSchemaObject, JsonSchemaType } from "./json-schema-specification";

/**
 * Generate a JSON Schema type definition. `objectAdditionalProperties` may
 * be used to configure whether additional properties should be allowed on
 * object types. This can be useful for data validation purposes where
 * property validation can be strict or lenient.
 *
 * @param type a contract type
 * @param objectAdditionalProperties whether to allow additional properties for objects
 */
export function typeToJsonSchemaType(
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
      return { type: "string", format: "date" };
    case TypeKind.DATE_TIME:
      return { type: "string", format: "date-time" };
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
          acc.properties[property.name] = typeToJsonSchemaType(
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
        items: typeToJsonSchemaType(
          type.elementType,
          objectAdditionalProperties
        )
      };
    case TypeKind.UNION:
      const elements = type.types;
      if (areBooleanLiteralTypes(elements)) {
        return {
          type: "boolean",
          enum: elements.map(e => e.value)
        };
      } else if (areStringLiteralTypes(elements)) {
        return {
          type: "string",
          enum: elements.map(e => e.value)
        };
      } else if (areFloatLiteralTypes(elements)) {
        return {
          type: "number",
          enum: elements.map(e => e.value)
        };
      } else if (areIntLiteralTypes(elements)) {
        return {
          type: "integer",
          enum: elements.map(e => e.value)
        };
      } else {
        // Guaranteed oneOf

        const oneOfElements = elements
          .filter(isNotLiteralType)
          .map(t => typeToJsonSchemaType(t, objectAdditionalProperties));

        const booleanLiterals = elements.filter(isBooleanLiteralType);
        switch (booleanLiterals.length) {
          case 0:
            break;
          case 1:
            oneOfElements.push(typeToJsonSchemaType(booleanLiterals[0]));
            break;
          default:
            oneOfElements.push({
              type: "boolean",
              enum: booleanLiterals.map(b => b.value)
            });
        }

        const stringLiterals = elements.filter(isStringLiteralType);
        switch (stringLiterals.length) {
          case 0:
            break;
          case 1:
            oneOfElements.push(typeToJsonSchemaType(stringLiterals[0]));
            break;
          default:
            oneOfElements.push({
              type: "string",
              enum: stringLiterals.map(s => s.value)
            });
        }

        const floatLiterals = elements.filter(isFloatLiteralType);
        switch (floatLiterals.length) {
          case 0:
            break;
          case 1:
            oneOfElements.push(typeToJsonSchemaType(floatLiterals[0]));
            break;
          default:
            oneOfElements.push({
              type: "number",
              enum: floatLiterals.map(f => f.value)
            });
        }

        const integerLiterals = elements.filter(isIntLiteralType);
        switch (integerLiterals.length) {
          case 0:
            break;
          case 1:
            oneOfElements.push(typeToJsonSchemaType(integerLiterals[0]));
            break;
          default:
            oneOfElements.push({
              type: "integer",
              enum: integerLiterals.map(i => i.value)
            });
        }

        return {
          oneOf: oneOfElements
        };
      }
    case TypeKind.REFERENCE:
      return {
        $ref: `#/definitions/${type.name}`
      };
    default:
      throw assertNever(type);
  }
}
