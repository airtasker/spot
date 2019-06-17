import assertNever from "assert-never";
import compact from "lodash/compact";
import { TypeDefinition } from "../../models/definitions";
import {
  DataType,
  ReferenceType,
  TypeKind,
  UnionType
} from "../../models/types";
import {
  inferDiscriminator,
  UnionDiscriminator
} from "../../utilities/infer-discriminator";

function isStringConstantUnion(type: UnionType): boolean {
  return type.types.reduce<boolean>((acc, type) => {
    return acc && type.kind === TypeKind.STRING_LITERAL;
  }, true);
}

export function openApi3TypeSchema(
  types: TypeDefinition[],
  type: DataType
): OpenAPI3SchemaType {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error(
        `The null type is only supported within a union in OpenAPI 3.`
      );
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
    case TypeKind.FLOAT:
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
    case TypeKind.INT32:
      return {
        type: "integer",
        format: "int32"
      };
    case TypeKind.INT64:
      return {
        type: "integer",
        format: "int64"
      };
    case TypeKind.OBJECT:
      return type.properties.reduce<OpenAPI3SchemaTypeObject>(
        (acc, property) => {
          if (!property.optional) {
            if (acc.required === undefined) {
              acc.required = [];
            }
            acc.required.push(property.name);
          }
          acc.properties[property.name] = openApi3TypeSchema(
            types,
            property.type
          );
          return acc;
        },
        {
          type: "object",
          properties: {}
        }
      );
    case TypeKind.ARRAY:
      return {
        type: "array",
        items: openApi3TypeSchema(types, type.elements)
      };
    case TypeKind.UNION:
      if (type.types.length === 1) {
        return openApi3TypeSchema(types, type.types[0]);
      }
      if (isStringConstantUnion(type)) {
        return {
          type: "string",
          enum: compact(
            type.types.map(t =>
              t.kind === TypeKind.STRING_LITERAL ? t.value : null
            )
          )
        };
      }
      const nullable = !!type.types.find(t => t.kind === TypeKind.NULL);
      const typesWithoutNull = type.types.filter(t => t.kind !== TypeKind.NULL);
      if (nullable) {
        const type = openApi3TypeSchema(types, {
          kind: TypeKind.UNION,
          types: typesWithoutNull
        });
        type.nullable = true;
        return type;
      }
      const discriminator = inferDiscriminator(types, type);
      return {
        oneOf: type.types.map(t => openApi3TypeSchema(types, t)),
        ...openApi3Discriminator(discriminator)
      };
    case TypeKind.TYPE_REFERENCE:
      return {
        $ref: openApi3RefForType(type)
      };
    default:
      throw assertNever(type);
  }
}

function openApi3Discriminator(
  discriminator: UnionDiscriminator | null
): { discriminator: OpenAPI3Discriminator } | {} {
  if (!discriminator) {
    return {};
  }
  const mapping: OpenAPI3DiscriminatorMapping = {};
  for (const [value, type] of discriminator.mapping.entries()) {
    if (type.kind !== TypeKind.TYPE_REFERENCE) {
      return {};
    }
    mapping[value] = openApi3RefForType(type);
  }
  return {
    discriminator: {
      propertyName: discriminator.propertyName,
      mapping
    }
  };
}

function openApi3RefForType(type: ReferenceType): string {
  return `#/components/schemas/${type.name}`;
}

export type OpenAPI3SchemaType =
  | OpenAPI3SchemaTypeObject
  | OpenAPI3SchemaTypeArray
  | OpenAPI3SchemaTypeOneOf
  | OpenAPI3SchemaTypeString
  | OpenAPI3SchemaTypeDateTime
  | OpenAPI3SchemaTypeNumber
  | OpenAPI3SchemaTypeInt
  | OpenAPI3SchemaTypeFloatDouble
  | OpenAPI3SchemaTypeInteger
  | OpenAPI3SchemaTypeBoolean
  | OpenAPI3SchemaTypeReference;

export interface OpenAPI3BaseSchemaType {
  nullable?: boolean;
  discriminator?: OpenAPI3Discriminator;
}

export interface OpenAPI3Discriminator {
  propertyName: string;
  mapping: OpenAPI3DiscriminatorMapping;
}

export interface OpenAPI3DiscriminatorMapping {
  [value: string]: OpenAPI3SchemaTypeRef;
}

export interface OpenAPI3SchemaTypeObject extends OpenAPI3BaseSchemaType {
  type: "object";
  properties: {
    [name: string]: OpenAPI3SchemaType;
  };
  required?: string[];
}

export interface OpenAPI3SchemaTypeArray extends OpenAPI3BaseSchemaType {
  type: "array";
  items: OpenAPI3SchemaType;
}

export interface OpenAPI3SchemaTypeOneOf extends OpenAPI3BaseSchemaType {
  oneOf: OpenAPI3SchemaType[];
}

export interface OpenAPI3SchemaTypeString extends OpenAPI3BaseSchemaType {
  type: "string";
  enum?: string[];
}

export interface OpenAPI3SchemaTypeNumber extends OpenAPI3BaseSchemaType {
  type: "number";
  enum?: number[];
}

export interface OpenAPI3SchemaTypeInteger extends OpenAPI3BaseSchemaType {
  type: "integer";
  enum?: number[];
}

export interface OpenAPI3SchemaTypeDateTime extends OpenAPI3BaseSchemaType {
  type: "string";
  format: "date" | "date-time";
}

export interface OpenAPI3SchemaTypeInt extends OpenAPI3BaseSchemaType {
  type: "integer";
  format: "int32" | "int64";
}

export interface OpenAPI3SchemaTypeFloatDouble extends OpenAPI3BaseSchemaType {
  type: "number";
  format: "float" | "double";
}

export interface OpenAPI3SchemaTypeBoolean extends OpenAPI3BaseSchemaType {
  type: "boolean";
  enum?: boolean[];
}

export interface OpenAPI3SchemaTypeReference extends OpenAPI3BaseSchemaType {
  $ref: OpenAPI3SchemaTypeRef;
}

// A reference to a schema, of the form "#/components/schemas/[schema-type]"
export type OpenAPI3SchemaTypeRef = string;
