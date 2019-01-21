import { HttpContentType } from "@airtasker/spot";
import assertNever from "assert-never";
import compact from "lodash/compact";
import { normalizedObjectType, Type, Types } from "../../models";

export function rejectVoidOpenApi3SchemaType(
  types: Types,
  type: Type,
  errorMessage: string
): OpenAPI3SchemaType {
  const schemaType = openApi3TypeSchema(types, type);
  if (!schemaType) {
    throw new Error(errorMessage);
  }
  return schemaType;
}

export function openApiV3ContentTypeSchema(
  types: Types,
  contentType: HttpContentType,
  type: Type
): OpenAPI3SchemaContentType {
  switch (contentType) {
    case "application/json":
      return {
        content: {
          "application/json": {
            schema: openApi3TypeSchema(types, type)
          }
        }
      };
    case "text/html":
      return {
        content: {
          "text/html": {
            schema: {
              type: "string"
            }
          }
        }
      };
    default:
      throw assertNever(contentType);
  }
}

function isStringConstantUnion(types: Type[]): boolean {
  return types.reduce((acc, type) => {
    return acc && type.kind === "string-constant";
  }, true);
}

export function openApi3TypeSchema(
  types: Types,
  type: Type
): OpenAPI3SchemaType | null {
  switch (type.kind) {
    case "void":
      return null;
    case "null":
      return {
        nullable: true
      };
    case "boolean":
      return {
        type: "boolean"
      };
    case "boolean-constant":
      return {
        type: "boolean",
        enum: [type.value]
      };
    case "date":
      return {
        type: "string",
        format: "date"
      };
    case "date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "string":
      return {
        type: "string"
      };
    case "string-constant":
      return {
        type: "string",
        enum: [type.value]
      };
    case "number":
      return {
        type: "number"
      };
    case "integer-constant":
      return {
        type: "integer",
        enum: [type.value]
      };
    case "int32":
      return {
        type: "integer",
        format: "int32"
      };
    case "int64":
      return {
        type: "integer",
        format: "int64"
      };
    case "float":
      return {
        type: "number",
        format: "float"
      };
    case "double":
      return {
        type: "number",
        format: "double"
      };
    case "object":
      return Object.entries(normalizedObjectType(types, type)).reduce(
        (acc, [name, type]) => {
          if (type.kind === "optional") {
            type = type.optional;
          } else {
            acc.required.push(name);
          }
          const schemaType = openApi3TypeSchema(types, type);
          if (schemaType) {
            acc.properties[name] = schemaType;
          }
          return acc;
        },
        {
          type: "object",
          properties: {},
          required: []
        } as OpenAPI3SchemaTypeObject & { required: string[] }
      );
    case "array":
      const itemsType = openApi3TypeSchema(types, type.elements);
      if (!itemsType) {
        throw new Error(`Unsupported void array`);
      }
      return {
        type: "array",
        items: itemsType
      };
    case "optional":
      throw new Error(`Unsupported top-level optional type`);
    case "union":
      const unionTypes = type.types.map(t => openApi3TypeSchema(types, t));
      const withoutNullTypes = compact(unionTypes);
      if (withoutNullTypes.length !== unionTypes.length) {
        throw new Error(`Unsupported void type in union`);
      }
      if (isStringConstantUnion(type.types)) {
        return {
          type: "string",
          enum: compact(
            type.types.map(t => (t.kind === "string-constant" ? t.value : null))
          )
        };
      }
      return {
        oneOf: withoutNullTypes
      };
    case "type-reference":
      return {
        $ref: `#/components/schemas/${type.typeName}`
      };
    default:
      throw assertNever(type);
  }
}

export type OpenAPI3SchemaType =
  | OpenAPI3SchemaTypeObject
  | OpenAPI3SchemaTypeArray
  | OpenAPI3SchemaTypeOneOf
  | OpenAPI3SchemaTypeNull
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
  discriminator?: {
    propertyName: string;
    mapping: {
      [value: string]: OpenAPI3SchemaType;
    };
  };
}

export type OpenAPI3SchemaContentType =
  | OpenAPI3SchemaApplicationJsonContentType
  | OpenAPI3SchemaTextHtmlContentType;

export interface OpenAPI3SchemaApplicationJsonContentType
  extends OpenAPI3BaseSchemaType {
  content: {
    "application/json": {
      schema: OpenAPI3SchemaType | null;
    };
  };
}

export interface OpenAPI3SchemaTextHtmlContentType
  extends OpenAPI3BaseSchemaType {
  content: {
    "text/html": {
      schema: OpenAPI3SchemaTypeString;
    };
  };
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

export interface OpenAPI3SchemaTypeNull extends OpenAPI3BaseSchemaType {}

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
  $ref: string;
}
