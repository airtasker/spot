import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  ArrayType,
  IntersectionType,
  isNotNullType,
  isReferenceType,
  ObjectType,
  ReferenceType,
  SchemaProp,
  Type,
  TypeKind,
  TypeTable,
  UnionType
} from "../../types";
import {
  discriminatedLeafReferences,
  discriminatorMapping,
  schemaReference
} from "./discriminator";
import { JsonType, SchemaObject } from "./openapi3-1-specification";

export function typeToSchemaObject(
  type: Type,
  typeTable: TypeTable
): SchemaObject {
  switch (type.kind) {
    case TypeKind.NULL:
      return { type: "null" };
    case TypeKind.BOOLEAN:
      return primitiveSchema("boolean", { schemaProps: type.schemaProps });
    case TypeKind.BOOLEAN_LITERAL:
      return primitiveSchema("boolean", {
        values: [type.value],
        schemaProps: type.schemaProps
      });
    case TypeKind.STRING:
      return primitiveSchema("string", { schemaProps: type.schemaProps });
    case TypeKind.STRING_LITERAL:
      return primitiveSchema("string", {
        values: [type.value],
        schemaProps: type.schemaProps
      });
    case TypeKind.FLOAT:
      return primitiveSchema("number", {
        format: "float",
        schemaProps: type.schemaProps
      });
    case TypeKind.DOUBLE:
      return primitiveSchema("number", {
        format: "double",
        schemaProps: type.schemaProps
      });
    case TypeKind.FLOAT_LITERAL:
      return primitiveSchema("number", {
        values: [type.value],
        format: "float",
        schemaProps: type.schemaProps
      });
    case TypeKind.INT32:
      return primitiveSchema("integer", {
        format: "int32",
        schemaProps: type.schemaProps
      });
    case TypeKind.INT64:
      return primitiveSchema("integer", {
        format: "int64",
        schemaProps: type.schemaProps
      });
    case TypeKind.INT_LITERAL:
      return primitiveSchema("integer", {
        values: [type.value],
        format: "int32",
        schemaProps: type.schemaProps
      });
    case TypeKind.DATE:
      return primitiveSchema("string", {
        format: "date",
        schemaProps: type.schemaProps
      });
    case TypeKind.DATE_TIME:
      return primitiveSchema("string", {
        format: "date-time",
        schemaProps: type.schemaProps
      });
    case TypeKind.OBJECT:
      return objectTypeToSchema(type, typeTable);
    case TypeKind.ARRAY:
      return arrayTypeToSchema(type, typeTable);
    case TypeKind.UNION:
      return unionTypeToSchema(type, typeTable);
    case TypeKind.INTERSECTION:
      return intersectionTypeToSchema(type, typeTable);
    case TypeKind.REFERENCE:
      return referenceTypeToSchema(type);
    default:
      assertNever(type);
  }
}

function primitiveSchema(
  type: Exclude<JsonType, "null" | "object" | "array">,
  opts: {
    values?: (string | number | boolean)[];
    format?: SchemaObject["format"];
    schemaProps?: SchemaProp[];
  }
): SchemaObject {
  return {
    type,
    enum: opts.values,
    format: opts.format,
    ...schemaPropsToSchemaObject(opts.schemaProps)
  };
}

function objectTypeToSchema(
  type: ObjectType,
  typeTable: TypeTable
): SchemaObject {
  const properties =
    type.properties.length > 0
      ? type.properties.reduce<{ [name: string]: SchemaObject }>(
          (acc, property) => {
            acc[property.name] = {
              ...typeToSchemaObject(property.type, typeTable),
              description: property.description
            };
            return acc;
          },
          {}
        )
      : undefined;

  const requiredProperties = type.properties
    .filter(p => !p.optional)
    .map(p => p.name);

  return {
    type: "object",
    properties,
    required: requiredProperties.length > 0 ? requiredProperties : undefined,
    ...schemaPropsToSchemaObject(type.schemaProps)
  };
}

function arrayTypeToSchema(
  type: ArrayType,
  typeTable: TypeTable
): SchemaObject {
  return {
    type: "array",
    items: typeToSchemaObject(type.elementType, typeTable),
    ...schemaPropsToSchemaObject(type.schemaProps)
  };
}

function unionTypeToSchema(
  type: UnionType,
  typeTable: TypeTable
): SchemaObject {
  const nonNullTypes = type.types.filter(isNotNullType);
  const nullable = nonNullTypes.length < type.types.length;
  const unionSchemaProps = schemaPropsToSchemaObject(type.schemaProps);

  if (nonNullTypes.length === 0) {
    return { type: "null", ...unionSchemaProps };
  }

  // A union of one type and null is that type made nullable. A discriminator
  // inferred from the one type alone is ignored, rather than wrapping the
  // type in a discriminated oneOf with a single member.
  if (nonNullTypes.length === 1) {
    const [member] = nonNullTypes;
    const schema = typeToSchemaObject(member, typeTable);
    return {
      ...(nullable ? orNull(member, schema, typeTable) : schema),
      ...unionSchemaProps
    };
  }

  const literalSchema = literalUnionToSchema(nonNullTypes);
  if (literalSchema !== undefined) {
    return {
      ...(nullable ? widenToNull(literalSchema) : literalSchema),
      ...unionSchemaProps
    };
  }

  if (type.discriminator !== undefined) {
    const { schema: discriminated, nullable: liftedNull } =
      discriminatedUnionToSchema(nonNullTypes, type.discriminator, typeTable);
    return nullable || liftedNull
      ? { anyOf: [discriminated, { type: "null" }], ...unionSchemaProps }
      : { ...discriminated, ...unionSchemaProps };
  }

  const members = nonNullTypes.map(t => typeToSchemaObject(t, typeTable));
  if (nullable && !nonNullTypes.some(t => admitsNull(t, typeTable))) {
    members.push({ type: "null" });
  }
  return { oneOf: members, ...unionSchemaProps };
}

function literalUnionToSchema(types: Type[]): SchemaObject | undefined {
  if (areBooleanLiteralTypes(types)) {
    return primitiveSchema("boolean", { values: types.map(t => t.value) });
  }
  if (areStringLiteralTypes(types)) {
    return primitiveSchema("string", { values: types.map(t => t.value) });
  }
  if (areFloatLiteralTypes(types)) {
    return primitiveSchema("number", {
      values: types.map(t => t.value),
      format: "float"
    });
  }
  if (areIntLiteralTypes(types)) {
    return primitiveSchema("integer", {
      values: types.map(t => t.value),
      format: "int32"
    });
  }
  return undefined;
}

/**
 * A `oneOf` with a discriminator. Each reference member is flattened to its
 * leaf references, so that each `oneOf` member and mapping target declares
 * the discriminator property itself. Inline members are kept as they are;
 * with one, there is no mapping, and readers match members by the
 * discriminator property alone.
 */
function discriminatedUnionToSchema(
  members: Type[],
  propertyName: string,
  typeTable: TypeTable
): { schema: SchemaObject; nullable: boolean } {
  const leaves = new Map<string, ReferenceType>();
  const oneOf: SchemaObject[] = [];
  let nullable = false;
  members.forEach(member => {
    if (!isReferenceType(member)) {
      oneOf.push(typeToSchemaObject(member, typeTable));
      return;
    }
    const flattened = discriminatedLeafReferences(member, typeTable);
    nullable = nullable || flattened.nullable;
    flattened.leaves
      .filter(leaf => !leaves.has(leaf.name))
      .forEach(leaf => {
        leaves.set(leaf.name, leaf);
        oneOf.push(referenceTypeToSchema(leaf));
      });
  });

  const mapping = discriminatorMapping(
    [...leaves.values()],
    propertyName,
    typeTable
  );
  return {
    schema: {
      oneOf,
      discriminator: members.every(isReferenceType)
        ? { propertyName, mapping }
        : { propertyName }
    },
    nullable
  };
}

function intersectionTypeToSchema(
  type: IntersectionType,
  typeTable: TypeTable
): SchemaObject {
  return {
    allOf: type.types.map(t => typeToSchemaObject(t, typeTable)),
    ...schemaPropsToSchemaObject(type.schemaProps)
  };
}

/**
 * Whether a type accepts `null`, through a `null` member of a union or a
 * reference to a type that does.
 */
function admitsNull(
  type: Type,
  typeTable: TypeTable,
  visited: Set<string> = new Set()
): boolean {
  switch (type.kind) {
    case TypeKind.NULL:
      return true;
    case TypeKind.UNION:
      return type.types.some(t => admitsNull(t, typeTable, visited));
    case TypeKind.REFERENCE:
      if (visited.has(type.name)) {
        return false;
      }
      return admitsNull(
        typeTable.getOrError(type.name).type,
        typeTable,
        new Set(visited).add(type.name)
      );
    default:
      return false;
  }
}

/**
 * `schema`, which was generated from `type`, widened to also accept `null`.
 * A schema that already accepts it is returned unchanged, so a reference to
 * a nullable type stays a bare `$ref`.
 */
function orNull(
  type: Type,
  schema: SchemaObject,
  typeTable: TypeTable
): SchemaObject {
  if (admitsNull(type, typeTable)) {
    return schema;
  }
  const isComposite = ["$ref", "oneOf", "anyOf", "allOf"].some(
    keyword => keyword in schema
  );
  if (schema.type !== undefined && !isComposite) {
    return widenToNull(schema);
  }
  return { anyOf: [schema, { type: "null" }] };
}

/** Adds `null` to a schema's `type`, and to its `enum` if it has one. */
function widenToNull(schema: SchemaObject): SchemaObject {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  return {
    ...schema,
    type: [...types.filter((t): t is JsonType => t !== undefined), "null"],
    enum: schema.enum && [...schema.enum, null]
  };
}

function referenceTypeToSchema(type: ReferenceType): SchemaObject {
  return { $ref: schemaReference(type.name) };
}

/**
 * These schemaprops take a different form in JSON Schema 2020-12, so copying
 * them unchanged would emit an invalid document.
 */
const UNCONVERTED_SCHEMA_PROPS = new Set([
  "example",
  "exclusiveMinimum",
  "exclusiveMaximum"
]);

function schemaPropsToSchemaObject(
  schemaProps: SchemaProp[] = []
): SchemaObject {
  return schemaProps.reduce<SchemaObject>((acc, schemaProp) => {
    if (UNCONVERTED_SCHEMA_PROPS.has(schemaProp.name)) {
      return unsupported(`The "${schemaProp.name}" schemaprop`);
    }
    return Object.assign(acc, { [schemaProp.name]: schemaProp.value });
  }, {});
}

function unsupported(subject: string): never {
  throw new Error(`${subject} is not supported by the OpenAPI 3.1 generator`);
}
