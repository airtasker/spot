import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  ArrayType,
  dereferenceType,
  isNotNullType,
  isNullType,
  isObjectType,
  isReferenceType,
  isStringLiteralType,
  ObjectType,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable,
  UnionType
} from "../../types";
import {
  ArraySchemaObject,
  BooleanSchemaObject,
  DiscriminatorObject,
  IntegerSchemaObject,
  NumberSchemaObject,
  ObjectPropertiesSchemaObject,
  ObjectSchemaObject,
  ReferenceObject,
  SchemaObject,
  StringSchemaObject
} from "./openapi3-specification";

export function typeToSchemaOrReferenceObject(
  type: Type,
  typeTable: TypeTable,
  nullable?: boolean
): SchemaObject | ReferenceObject {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error("Null must be part of a union for OpenAPI 3");
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
    nullable: opts.nullable || undefined
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
    nullable: opts.nullable || undefined
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
    nullable: opts.nullable || undefined
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
    nullable: opts.nullable || undefined
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
            acc[property.name] = typeToSchemaOrReferenceObject(
              property.type,
              typeTable
            );
            return acc;
          },
          {}
        )
      : undefined;

  const required =
    type.properties.length > 0
      ? type.properties.filter(p => !p.optional).map(p => p.name)
      : undefined;

  return {
    type: "object",
    properties,
    required,
    nullable: nullable || undefined
  };
}

function arrayTypeToSchema(
  type: ArrayType,
  typeTable: TypeTable,
  nullable?: boolean
): ArraySchemaObject {
  return {
    type: "array",
    items: typeToSchemaOrReferenceObject(type.elementType, typeTable),
    nullable: nullable || undefined
  };
}

/**
 * Unions are NOT flattened
 */
function unionTypeToSchema(
  type: UnionType,
  typeTable: TypeTable
): SchemaObject | ReferenceObject {
  // Sanity check
  if (type.types.length === 0) {
    throw new Error("Unexpected type: union with no types");
  }

  const nullable = type.types.some(isNullType);
  const nonNullTypes = type.types.filter(isNotNullType);

  switch (nonNullTypes.length) {
    case 0: // previous guard guarantees only null was present
      throw new Error("Null must be part of a union for OpenAPI 3");
    case 1: // not an OpenAPI union, but a single type, possibly nullable
      return typeToSchemaOrReferenceObject(
        nonNullTypes[0],
        typeTable,
        nullable
      );
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
        return {
          nullable: nullable || undefined,
          oneOf: nonNullTypes.map(t =>
            typeToSchemaOrReferenceObject(t, typeTable)
          ),
          discriminator: unionTypeToDiscrimintorObject(type, typeTable)
        };
      }
  }
}

function unionTypeToDiscrimintorObject(
  unionType: UnionType,
  typeTable: TypeTable
): DiscriminatorObject | undefined {
  if (unionType.discriminator === undefined) return undefined;

  const nonNullTypes = unionType.types.filter(isNotNullType);

  // Discriminator mapping is only supported for reference types
  const objectReferenceOnly = nonNullTypes.every(
    t => isReferenceType(t) && isObjectType(dereferenceType(t, typeTable))
  );
  if (!objectReferenceOnly) return { propertyName: unionType.discriminator };

  const mapping = nonNullTypes.reduce<{ [key: string]: string }>((acc, t) => {
    // Sanity check and type cast
    if (!isReferenceType(t)) {
      throw new Error("Unexpected error: expected reference type");
    }

    const concreteType = dereferenceType(t, typeTable);

    // Sanity check and type cast
    if (!isObjectType(concreteType)) {
      throw new Error("Unexpected error: expected object reference type");
    }

    // Retrieve the discriminator property
    // Discriminator properties cannot be optional - we assume this is handled by the type parser
    const discriminatorProp = concreteType.properties.find(
      p => p.name === unionType.discriminator
    );
    if (discriminatorProp === undefined) {
      throw new Error(
        "Unexpected error: could not find expected discriminator property"
      );
    }

    // Extract the property type - this is expected to be a string literal
    const discriminatorPropType = dereferenceType(
      discriminatorProp.type,
      typeTable
    );
    if (!isStringLiteralType(discriminatorPropType)) {
      throw new Error(
        "Unexpected error: expected discriminator property type to be a string literal"
      );
    }

    acc[discriminatorPropType.value] = referenceObjectValue(t.name);
    return acc;
  }, {});

  return {
    propertyName: unionType.discriminator,
    mapping
  };
}

function referenceTypeToSchema(
  type: ReferenceType,
  nullable?: boolean
): ReferenceObject {
  return {
    $ref: referenceObjectValue(type.name),
    nullable: nullable || undefined
  };
}

function referenceObjectValue(referenceName: string): string {
  return `#/components/schemas/${referenceName}`;
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
