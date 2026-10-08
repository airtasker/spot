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
  NullType,
  ObjectType,
  ReferenceType,
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
      return primitiveSchema("boolean", { owner: type });
    case TypeKind.BOOLEAN_LITERAL:
      return primitiveSchema("boolean", {
        values: [type.value],
        owner: type
      });
    case TypeKind.STRING:
      return primitiveSchema("string", { owner: type });
    case TypeKind.STRING_LITERAL:
      return primitiveSchema("string", {
        values: [type.value],
        owner: type
      });
    case TypeKind.FLOAT:
      return primitiveSchema("number", {
        format: "float",
        owner: type
      });
    case TypeKind.DOUBLE:
      return primitiveSchema("number", {
        format: "double",
        owner: type
      });
    case TypeKind.FLOAT_LITERAL:
      return primitiveSchema("number", {
        values: [type.value],
        format: "float",
        owner: type
      });
    case TypeKind.INT32:
      return primitiveSchema("integer", {
        format: "int32",
        owner: type
      });
    case TypeKind.INT64:
      return primitiveSchema("integer", {
        format: "int64",
        owner: type
      });
    case TypeKind.INT_LITERAL:
      return primitiveSchema("integer", {
        values: [type.value],
        format: "int32",
        owner: type
      });
    case TypeKind.DATE:
      return primitiveSchema("string", {
        format: "date",
        owner: type
      });
    case TypeKind.DATE_TIME:
      return primitiveSchema("string", {
        format: "date-time",
        owner: type
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
    owner?: SchemaPropOwner;
  }
): SchemaObject {
  return {
    type,
    enum: opts.values,
    format: opts.format,
    ...(opts.owner && schemaPropsToSchemaObject(opts.owner))
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
    ...schemaPropsToSchemaObject(type)
  };
}

function arrayTypeToSchema(
  type: ArrayType,
  typeTable: TypeTable
): SchemaObject {
  return {
    type: "array",
    items: typeToSchemaObject(type.elementType, typeTable),
    ...schemaPropsToSchemaObject(type)
  };
}

function unionTypeToSchema(
  type: UnionType,
  typeTable: TypeTable
): SchemaObject {
  const nonNullTypes = type.types.filter(isNotNullType);
  const nullable = nonNullTypes.length < type.types.length;
  const unionSchemaProps = schemaPropsToSchemaObject(type);

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
    ...schemaPropsToSchemaObject(type)
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

type SchemaPropOwner = Exclude<Type, NullType | ReferenceType>;

/**
 * The schemaprops of `owner` as JSON Schema 2020-12 keywords.
 *
 * - `example` becomes a one-item `examples`.
 * - `exclusiveMinimum: true` moves the `minimum` value into a numeric
 *   `exclusiveMinimum`, and likewise for the maximum. A `false` flag is
 *   dropped, and the bound is kept as it is.
 * - Every other schemaprop is copied unchanged.
 *
 * @throws if an exclusive flag is `true` with no bound to make exclusive
 */
function schemaPropsToSchemaObject(owner: SchemaPropOwner): SchemaObject {
  const schemaProps = new Map(
    (owner.schemaProps ?? []).map(p => [p.name, p.value])
  );
  const schema: SchemaObject = {};
  schemaProps.forEach((value, name) => {
    switch (name) {
      case "example":
        schema.examples = [value];
        return;
      case "minimum":
      case "maximum": {
        const exclusive = EXCLUSIVE_FLAG[name];
        Object.assign(schema, {
          [schemaProps.get(exclusive) === true ? exclusive : name]: value
        });
        return;
      }
      case "exclusiveMinimum":
      case "exclusiveMaximum": {
        const bound = name === "exclusiveMinimum" ? "minimum" : "maximum";
        if (value === true && !schemaProps.has(bound)) {
          throw new Error(
            `The "${name}" schemaprop on type "${owner.kind}" has no "${bound}" ` +
              `to make exclusive. OpenAPI 3.1 states an exclusive bound as a ` +
              `number in "${name}", so add a "${bound}" or remove "${name}".`
          );
        }
        return;
      }
      default:
        Object.assign(schema, { [name]: value });
    }
  });
  return schema;
}

const EXCLUSIVE_FLAG = {
  minimum: "exclusiveMinimum",
  maximum: "exclusiveMaximum"
} as const;
