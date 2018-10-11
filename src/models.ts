import { HttpMethod } from "./lib";

export interface Api {
  endpoints: {
    [name: string]: Endpoint;
  };
  types: {
    [name: string]: Type;
  };
}

export interface Endpoint {
  method: HttpMethod;
  path: string;
  pathParameters: Param[];
  requestType: Type;
  responseType: Type;
}

export interface Param {
  name: string;
  type: Type;
}

export type Type =
  | VoidType
  | NullType
  | BooleanType
  | StringType
  | NumberType
  | ObjectType
  | ArrayType
  | OptionalType
  | TypeReference;

export const VOID: VoidType = {
  kind: "void"
};

export interface VoidType {
  kind: "void";
}

export const NULL: NullType = {
  kind: "null"
};

export interface NullType {
  kind: "null";
}

export const BOOLEAN: BooleanType = {
  kind: "boolean"
};

export interface BooleanType {
  kind: "boolean";
}

export const STRING: StringType = {
  kind: "string"
};

export interface StringType {
  kind: "string";
}

export const NUMBER: NumberType = {
  kind: "number"
};

export interface NumberType {
  kind: "number";
}

export function objectType(properties: { [key: string]: Type }): ObjectType {
  return {
    kind: "object",
    properties
  };
}

export interface ObjectType {
  kind: "object";
  properties: {
    [key: string]: Type;
  };
}

export function arrayType(elements: Type): ArrayType {
  return {
    kind: "array",
    elements
  };
}

export interface ArrayType {
  kind: "array";
  elements: Type;
}

export function optionalType(type: Type): OptionalType {
  if (type.kind === "optional") {
    return type;
  }
  return {
    kind: "optional",
    optional: type
  };
}

export interface OptionalType {
  kind: "optional";
  optional: Type;
}

export function typeReference(typeName: string): TypeReference {
  return {
    kind: "type-reference",
    typeName
  };
}

export type TypeReference = {
  kind: "type-reference";
  typeName: string;
};
