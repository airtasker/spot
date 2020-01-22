import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  ArrayType,
  isNotNullType,
  isNullType,
  ObjectType,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable,
  UnionType
} from "../../types";
import {
  AllOfSchemaObject,
  ArraySchemaObject,
  BooleanSchemaObject,
  IntegerSchemaObject,
  NumberSchemaObject,
  ObjectPropertiesSchemaObject,
  ObjectSchemaObject,
  ReferenceSchemaObject,
  SchemaObject,
  StringSchemaObject
} from "./openapi2-specification";

export function typeToSchemaObject(
  type: Type,
  typeTable: TypeTable,
  nullable?: boolean
): SchemaObject {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error("Null must be part of a union for OpenAPI 2");
    case TypeKind.BOOLEAN:
      return booleanSchema({ nullable });
    case TypeKind.BOOLEAN_LITERAL:
      return booleanSchema({ values: [type.value], nullable });
    case TypeKind.STRING:
      return stringSchema({ nullable });
    case TypeKind.STRING_LITERAL:
      return stringSchema({ values: [type.value], nullable });
    case TypeKind.FLOAT:
      return numberSchema({ format: "float", nullable });
    case TypeKind.DOUBLE:
      return numberSchema({ format: "double", nullable });
    case TypeKind.FLOAT_LITERAL:
      return numberSchema({ values: [type.value], format: "float", nullable });
    case TypeKind.INT32:
      return integerSchema({ format: "int32", nullable });
    case TypeKind.INT64:
      return integerSchema({ format: "int64", nullable });
    case TypeKind.INT_LITERAL:
      return integerSchema({ values: [type.value], format: "int32", nullable });
    case TypeKind.DATE:
      return stringSchema({ format: "date", nullable });
    case TypeKind.DATE_TIME:
      return stringSchema({ format: "date-time", nullable });
    case TypeKind.OBJECT:
      return objectTypeToSchema(type, typeTable, nullable);
    case TypeKind.ARRAY:
      return arrayTypeToSchema(type, typeTable, nullable);
    case TypeKind.UNION:
      return unionTypeToSchema(type, typeTable);
    case TypeKind.REFERENCE:
      return referenceTypeToSchema(type, nullable);
    default:
      assertNever(type);
  }
}

function booleanSchema(
  opts: {
    values?: boolean[];
    nullable?: boolean;
  } = {}
): BooleanSchemaObject {
  return {
    type: "boolean",
    enum: createEnum(opts.values, opts.nullable),
    "x-nullable": opts.nullable || undefined
  };
}

function stringSchema(
  opts: {
    values?: string[];
    nullable?: boolean;
    format?: StringSchemaObject["format"];
  } = {}
): StringSchemaObject {
  return {
    type: "string",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    "x-nullable": opts.nullable || undefined
  };
}

function numberSchema(
  opts: {
    values?: number[];
    nullable?: boolean;
    format?: NumberSchemaObject["format"];
  } = {}
): NumberSchemaObject {
  return {
    type: "number",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    "x-nullable": opts.nullable || undefined
  };
}

function integerSchema(
  opts: {
    values?: number[];
    nullable?: boolean;
    format?: IntegerSchemaObject["format"];
  } = {}
): IntegerSchemaObject {
  return {
    type: "integer",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    "x-nullable": opts.nullable || undefined
  };
}

function objectTypeToSchema(
  type: ObjectType,
  typeTable: TypeTable,
  nullable?: boolean
): ObjectSchemaObject {
  const properties =
    type.properties.length > 0
      ? type.properties.reduce<ObjectPropertiesSchemaObject>(
          (acc, property) => {
            acc[property.name] = typeToSchemaObject(property.type, typeTable);
            return acc;
          },
          {}
        )
      : undefined;

  const requiredProperties = type.properties
    .filter(p => !p.optional)
    .map(p => p.name);
  const required =
    requiredProperties.length > 0 ? requiredProperties : undefined;

  return {
    type: "object",
    properties,
    required,
    "x-nullable": nullable || undefined
  };
}

function arrayTypeToSchema(
  type: ArrayType,
  typeTable: TypeTable,
  nullable?: boolean
): ArraySchemaObject {
  return {
    type: "array",
    items: typeToSchemaObject(type.elementType, typeTable),
    "x-nullable": nullable || undefined
  };
}

/**
 * Unions are NOT flattened
 */
function unionTypeToSchema(
  type: UnionType,
  typeTable: TypeTable
): SchemaObject {
  // Sanity check
  if (type.types.length === 0) {
    throw new Error("Unexpected type: union with no types");
  }

  const nullable = type.types.some(isNullType);
  const nonNullTypes = type.types.filter(isNotNullType);

  switch (nonNullTypes.length) {
    case 0: // previous guard guarantees only null was present
      throw new Error("Null must be part of a union for OpenAPI 2");
    case 1: // not an OpenAPI union, but a single type, possibly nullable
      return typeToSchemaObject(nonNullTypes[0], typeTable, nullable);
    default:
      if (areBooleanLiteralTypes(nonNullTypes)) {
        return booleanSchema({
          values: nonNullTypes.map(t => t.value),
          nullable
        });
      } else if (areStringLiteralTypes(nonNullTypes)) {
        return stringSchema({
          values: nonNullTypes.map(t => t.value),
          nullable
        });
      } else if (areFloatLiteralTypes(nonNullTypes)) {
        return numberSchema({
          values: nonNullTypes.map(t => t.value),
          format: "float",
          nullable
        });
      } else if (areIntLiteralTypes(nonNullTypes)) {
        return integerSchema({
          values: nonNullTypes.map(t => t.value),
          format: "int32",
          nullable
        });
      } else {
        // See https://github.com/OAI/OpenAPI-Specification/issues/333
        throw new Error(`Unions are not supported in OpenAPI 2`);
      }
  }
}

function referenceTypeToSchema(
  type: ReferenceType,
  nullable?: boolean
): ReferenceSchemaObject | AllOfSchemaObject {
  if (nullable) {
    return {
      "x-nullable": true,
      allOf: [{ $ref: referenceObjectValue(type.name) }]
    };
  } else {
    return { $ref: referenceObjectValue(type.name) };
  }
}

function referenceObjectValue(referenceName: string): string {
  return `#/definitions/${referenceName}`;
}

/**
 * Enum generation helper
 */
function createEnum<T>(
  values?: T[],
  nullable?: boolean
): (T | null)[] | undefined {
  if (!values) return;
  return nullable ? [...values, null] : values;
}
