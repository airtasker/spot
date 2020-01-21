import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  BooleanLiteralType,
  FloatLiteralType,
  IntLiteralType,
  isBooleanLiteralType,
  isFloatLiteralType,
  isIntLiteralType,
  isNotLiteralType,
  isStringLiteralType,
  StringLiteralType,
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
      if (elements.length === 0) throw new Error("Union type has no elements");
      if (elements.length === 1) return typeToJsonSchemaType(elements[0]);

      if (
        areBooleanLiteralTypes(elements) ||
        areStringLiteralTypes(elements) ||
        areFloatLiteralTypes(elements) ||
        areIntLiteralTypes(elements)
      ) {
        return singleTypeLiteralsToSchema(elements);
      } else {
        // Guaranteed oneOf

        const oneOfElements = elements
          .filter(isNotLiteralType)
          .map(t => typeToJsonSchemaType(t, objectAdditionalProperties));

        const booleanLiterals = elements.filter(isBooleanLiteralType);
        if (booleanLiterals.length > 0) {
          oneOfElements.push(singleTypeLiteralsToSchema(booleanLiterals));
        }

        const stringLiterals = elements.filter(isStringLiteralType);
        if (stringLiterals.length > 0) {
          oneOfElements.push(singleTypeLiteralsToSchema(stringLiterals));
        }

        const floatLiterals = elements.filter(isFloatLiteralType);
        if (floatLiterals.length > 0) {
          oneOfElements.push(singleTypeLiteralsToSchema(floatLiterals));
        }

        const integerLiterals = elements.filter(isIntLiteralType);
        if (integerLiterals.length > 0) {
          oneOfElements.push(singleTypeLiteralsToSchema(integerLiterals));
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

function singleTypeLiteralsToSchema(
  literals:
    | BooleanLiteralType[]
    | StringLiteralType[]
    | FloatLiteralType[]
    | IntLiteralType[]
): JsonSchemaType {
  switch (literals.length) {
    case 0:
      throw new Error("no literals found");
    case 1:
      return typeToJsonSchemaType(literals[0]);
    default:
      if (areBooleanLiteralTypes(literals)) {
        literals.map(e => e.value);
        return {
          type: "boolean",
          enum: literals.map(e => e.value)
        };
      } else if (areStringLiteralTypes(literals)) {
        return {
          type: "string",
          enum: literals.map(e => e.value)
        };
      } else if (areFloatLiteralTypes(literals)) {
        return {
          type: "number",
          enum: literals.map(e => e.value)
        };
      } else if (areIntLiteralTypes(literals)) {
        return {
          type: "integer",
          enum: literals.map(e => e.value)
        };
      } else {
        throw new Error("Unknown literals");
      }
  }
}
