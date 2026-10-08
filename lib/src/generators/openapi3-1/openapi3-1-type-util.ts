import assertNever from "assert-never";
import {
  areBooleanLiteralTypes,
  areFloatLiteralTypes,
  areIntLiteralTypes,
  areStringLiteralTypes,
  ArrayType,
  isNullType,
  ObjectType,
  ReferenceType,
  SchemaProp,
  Type,
  TypeKind,
  TypeTable,
  UnionType
} from "../../types";
import { JsonType, SchemaObject } from "./openapi3-1-specification";

export function typeToSchemaObject(
  type: Type,
  typeTable: TypeTable
): SchemaObject {
  switch (type.kind) {
    case TypeKind.NULL:
      return unsupported("The null type");
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
      return unionTypeToSchema(type);
    case TypeKind.INTERSECTION:
      return unsupported("An intersection type");
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

function unionTypeToSchema(type: UnionType): SchemaObject {
  if (type.types.some(isNullType)) {
    return unsupported("A union with null");
  }

  const types = type.types;
  if (types.length > 1) {
    if (areBooleanLiteralTypes(types)) {
      return primitiveSchema("boolean", {
        values: types.map(t => t.value),
        schemaProps: type.schemaProps
      });
    }
    if (areStringLiteralTypes(types)) {
      return primitiveSchema("string", {
        values: types.map(t => t.value),
        schemaProps: type.schemaProps
      });
    }
    if (areFloatLiteralTypes(types)) {
      return primitiveSchema("number", {
        values: types.map(t => t.value),
        format: "float",
        schemaProps: type.schemaProps
      });
    }
    if (areIntLiteralTypes(types)) {
      return primitiveSchema("integer", {
        values: types.map(t => t.value),
        format: "int32",
        schemaProps: type.schemaProps
      });
    }
  }

  return unsupported("A union other than a union of literals of one kind");
}

function referenceTypeToSchema(type: ReferenceType): SchemaObject {
  return { $ref: `#/components/schemas/${type.name}` };
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
