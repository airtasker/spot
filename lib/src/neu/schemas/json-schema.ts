export interface JsonSchema {
  $schema: "http://json-schema.org/draft-07/schema#";
  definitions: {
    [typeName: string]: JsonSchemaType;
  };
}

export type JsonSchemaType =
  | JsonSchemaObject
  | JsonSchemaArray
  | JsonSchemaOneOf
  | JsonSchemaNull
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaInteger
  | JsonSchemaBoolean
  | JsonSchemaTypeReference;

export interface JsonSchemaObject {
  type: "object";
  properties: {
    [name: string]: JsonSchemaType;
  };
  required?: string[];
  additionalProperties: boolean;
}

export interface JsonSchemaArray {
  type: "array";
  items: JsonSchemaType;
}

export interface JsonSchemaOneOf {
  oneOf: JsonSchemaType[];
  discriminator?: {
    propertyName: string;
    mapping: {
      [value: string]: JsonSchemaType;
    };
  };
}

export interface JsonSchemaNull {
  type: "null";
}

export interface JsonSchemaString {
  type: "string";
  format?: string;
  const?: string;
  enum?: string[];
}

export interface JsonSchemaNumber {
  type: "number";
  const?: number;
  enum?: number[];
}

export interface JsonSchemaInteger {
  type: "integer";
  const?: number;
  enum?: number[];
}

export interface JsonSchemaBoolean {
  type: "boolean";
  const?: boolean;
}

export interface JsonSchemaTypeReference {
  $ref: string;
}
