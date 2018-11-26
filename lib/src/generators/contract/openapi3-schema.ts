import assertNever from "../../assert-never";
import { Type } from "../../models";
import compact = require("lodash/compact");
import { HttpContentType } from "@airtasker/spot";

export function rejectVoidOpenApi3SchemaType(
  type: Type,
  errorMessage: string
): OpenAPI3SchemaType {
  const schemaType = openApi3TypeSchema(type);
  if (!schemaType) {
    throw new Error(errorMessage);
  }
  return schemaType;
}

export function openApiV3ContentTypeSchema(
  contentType: HttpContentType,
  type: Type
): OpenAPI3SchemaContentType {
  switch (contentType) {
    case "application/json":
      return {
        content: {
          "application/json": {
            schema: openApi3TypeSchema(type)
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

export function openApi3TypeSchema(type: Type): OpenAPI3SchemaType | null {
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
      return Object.entries(type.properties).reduce(
        (acc, [name, type]) => {
          if (type.kind === "optional") {
            type = type.optional;
          } else {
            acc.required.push(name);
          }
          const schemaType = openApi3TypeSchema(type);
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
      const itemsType = openApi3TypeSchema(type.elements);
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
      const types = type.types.map(t => openApi3TypeSchema(t));
      const withoutNullTypes = compact(types);
      if (withoutNullTypes.length !== types.length) {
        throw new Error(`Unsupported void type in union`);
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
