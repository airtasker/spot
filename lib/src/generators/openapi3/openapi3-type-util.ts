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
  IntersectionType,
  Type,
  TypeKind,
  TypeTable,
  UnionType,
  possibleRootTypes,
  ObjectPropertiesType
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
  SchemaPropObject,
  SchemaPropsSet,
  StringSchemaObject
} from "./openapi3-specification";
import { SchemaProp } from "../../definitions";

export function typeToSchemaOrReferenceObject(
  type: Type,
  typeTable: TypeTable,
  schemaProps?: SchemaPropObject,
  nullable?: boolean
): SchemaObject | ReferenceObject {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error("Null must be part of a union for OpenAPI 3");
    case TypeKind.BOOLEAN:
      return booleanSchema({
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.BOOLEAN_LITERAL:
      return booleanSchema({
        values: [type.value],
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.STRING:
      return stringSchema({
        minLength: schemaProps?.minLength,
        maxLength: schemaProps?.maxLength,
        pattern: schemaProps?.pattern,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.STRING_LITERAL:
      return stringSchema({
        values: [type.value],
        minLength: schemaProps?.minLength,
        maxLength: schemaProps?.maxLength,
        pattern: schemaProps?.pattern,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.FLOAT:
      return numberSchema({
        format: "float",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.DOUBLE:
      return numberSchema({
        format: "double",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.FLOAT_LITERAL:
      return numberSchema({
        values: [type.value],
        format: "float",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.INT32:
      return integerSchema({
        format: "int32",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.INT64:
      return integerSchema({
        format: "int64",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.INT_LITERAL:
      return integerSchema({
        values: [type.value],
        format: "int32",
        minimum: schemaProps?.minimum,
        maximum: schemaProps?.maximum,
        default: schemaProps?.default,
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.DATE:
      return stringSchema({
        format: "date",
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.DATE_TIME:
      return stringSchema({
        format: "date-time",
        example: schemaProps?.example,
        nullable
      });
    case TypeKind.OBJECT:
      return objectTypeToSchema(type, typeTable, nullable);
    case TypeKind.ARRAY:
      return arrayTypeToSchema(type, typeTable, schemaProps, nullable);
    case TypeKind.UNION:
      return unionTypeToSchema(type, typeTable, schemaProps);
    case TypeKind.INTERSECTION:
      return intersectionTypeToSchema(type, typeTable, schemaProps);
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
    example?: BooleanSchemaObject["example"];
  } = {}
): BooleanSchemaObject {
  return {
    type: "boolean",
    enum: createEnum(opts.values, opts.nullable),
    example: opts.example,
    nullable: opts.nullable || undefined
  };
}

function stringSchema(
  opts: {
    values?: string[];
    nullable?: boolean;
    format?: StringSchemaObject["format"];
    minLength?: StringSchemaObject["minLength"];
    maxLength?: StringSchemaObject["maxLength"];
    pattern?: StringSchemaObject["pattern"];
    example?: StringSchemaObject["example"];
  } = {}
): StringSchemaObject {
  return {
    type: "string",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    minLength: opts.minLength,
    maxLength: opts.maxLength,
    pattern: opts.pattern,
    example: opts.example,
    nullable: opts.nullable || undefined
  };
}

function numberSchema(
  opts: {
    values?: number[];
    nullable?: boolean;
    format?: NumberSchemaObject["format"];
    minimum?: NumberSchemaObject["minimum"];
    maximum?: NumberSchemaObject["maximum"];
    default?: NumberSchemaObject["default"];
    example?: NumberSchemaObject["example"];
  } = {}
): NumberSchemaObject {
  return {
    type: "number",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    minimum: opts.minimum,
    maximum: opts.maximum,
    default: opts.default,
    example: opts.example,
    nullable: opts.nullable || undefined
  };
}

function integerSchema(
  opts: {
    values?: number[];
    nullable?: boolean;
    format?: IntegerSchemaObject["format"];
    minimum?: IntegerSchemaObject["minimum"];
    maximum?: IntegerSchemaObject["maximum"];
    default?: IntegerSchemaObject["default"];
    example?: IntegerSchemaObject["example"];
  } = {}
): IntegerSchemaObject {
  return {
    type: "integer",
    enum: createEnum(opts.values, opts.nullable),
    format: opts.format,
    minimum: opts.minimum,
    maximum: opts.maximum,
    default: opts.default,
    example: opts.example,
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
            const propType = typeToSchemaOrReferenceObject(
              property.type,
              typeTable,
              schemaPropToOpenApi(property.schemaProps)
            );
            if (!isReferenceObject(propType)) {
              propType.description = property.description;
            }
            acc[property.name] = propType;
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
    nullable: nullable || undefined
  };
}

function arrayTypeToSchema(
  type: ArrayType,
  typeTable: TypeTable,
  schemaProps?: SchemaPropObject,
  nullable?: boolean
): ArraySchemaObject {
  return {
    type: "array",
    items: typeToSchemaOrReferenceObject(
      type.elementType,
      typeTable,
      schemaProps
    ),
    nullable: nullable || undefined
  };
}

/**
 * Unions are NOT flattened
 */
function unionTypeToSchema(
  type: UnionType,
  typeTable: TypeTable,
  schemaProps?: SchemaPropObject
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
        schemaProps,
        nullable
      );
    default:
      if (areBooleanLiteralTypes(nonNullTypes)) {
        return booleanSchema({
          values: nonNullTypes.map(t => t.value),
          example: schemaProps?.example,
          nullable
        });
      } else if (areStringLiteralTypes(nonNullTypes)) {
        return stringSchema({
          values: nonNullTypes.map(t => t.value),
          minLength: schemaProps?.minLength,
          maxLength: schemaProps?.maxLength,
          pattern: schemaProps?.pattern,
          example: schemaProps?.example,
          nullable
        });
      } else if (areFloatLiteralTypes(nonNullTypes)) {
        return numberSchema({
          values: nonNullTypes.map(t => t.value),
          format: "float",
          minimum: schemaProps?.minimum,
          maximum: schemaProps?.maximum,
          default: schemaProps?.default,
          example: schemaProps?.example,
          nullable
        });
      } else if (areIntLiteralTypes(nonNullTypes)) {
        return integerSchema({
          values: nonNullTypes.map(t => t.value),
          format: "int32",
          minimum: schemaProps?.minimum,
          maximum: schemaProps?.maximum,
          default: schemaProps?.default,
          example: schemaProps?.example,
          nullable
        });
      } else {
        return {
          nullable: nullable || undefined,
          oneOf: nonNullTypes.map(t =>
            typeToSchemaOrReferenceObject(t, typeTable, schemaProps)
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
  // however reference can even point to union or
  // intersection types. This ensures those also meet the
  // requirement
  const objectReferenceOnly = nonNullTypes.every(t => {
    return (
      isReferenceType(t) && possibleRootTypes(t, typeTable).every(isObjectType)
    );
  });

  if (!objectReferenceOnly) return { propertyName: unionType.discriminator };

  const mapping = nonNullTypes.reduce<{ [key: string]: string }>((acc, t) => {
    // Sanity check and type cast
    if (!isReferenceType(t)) {
      throw new Error("Unexpected error: expected reference type");
    }

    const concreteTypes = possibleRootTypes(t, typeTable);

    // Sanity check and type cast
    if (!concreteTypes.every(isObjectType)) {
      throw new Error("Unexpected error: expected object reference type");
    }

    // Retrieve the discriminator property
    // Discriminator properties cannot be optional - we assume this is handled by the type parser
    // We first determine the object which contains the discriminator
    // followed by which we identify the prop itself.
    // This helps us identify discriminators even if one of the unions is an intersection or is
    // a union of unions
    const discriminatorObject = concreteTypes.find(object => {
      return object.properties.find(p => p.name === unionType.discriminator);
    });

    if (discriminatorObject === undefined) {
      throw new Error(
        "Unexpected error: could not find expected discriminator property in objects"
      );
    }

    const discriminatorProp = discriminatorObject.properties.find(
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

function intersectionTypeToSchema(
  type: IntersectionType,
  typeTable: TypeTable,
  schemaProps?: SchemaPropObject
): SchemaObject | ReferenceObject {
  // Sanity check: This should not be possible
  if (type.types.length === 0) {
    throw new Error("Unexpected type: intersection type with no types");
  }

  const nullable = type.types.some(isNullType);
  const nonNullTypes = type.types.filter(isNotNullType);

  return {
    nullable: nullable || undefined,
    allOf: nonNullTypes.map((t: Type) =>
      typeToSchemaOrReferenceObject(t, typeTable, schemaProps)
    )
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

export function isReferenceObject(
  typeObject: SchemaObject | ReferenceObject
): typeObject is ReferenceObject {
  return "$ref" in typeObject;
}

export function schemaPropToOpenApi(
  schemaProps?: SchemaProp[]
): SchemaPropsSet | undefined {
  return schemaProps?.reduce<SchemaPropsSet>((acc, schemaProp: SchemaProp) => {
    acc[schemaProp.name] = schemaProp.value;
    return acc;
  }, {});
}
