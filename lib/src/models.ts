import compact = require("lodash/compact");
import uniq = require("lodash/uniq");
import { HttpContentType, HttpMethod } from "./lib";

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
  path: PathComponent[];
  headers: Headers;
  queryParams: QueryParamComponent[];
  requestContentType?: HttpContentType;
  requestType: Type;
  responseType: Type;
  successStatusCode?: number;
  genericErrorType: Type;
  specificErrorTypes: {
    [name: string]: SpecificError;
  };
}

export function gatherTypes(endpoint: Endpoint): Type[] {
  return uniq([
    ...compact(endpoint.path.map(p => (p.kind === "dynamic" ? p.type : null))),
    ...Object.values(endpoint.headers).map(h => h.type),
    endpoint.requestType,
    endpoint.responseType,
    endpoint.genericErrorType,
    ...Object.values(endpoint.specificErrorTypes).map(s => s.type)
  ]);
}

export type PathComponent = StaticPathComponent | DynamicPathComponent;

export interface StaticPathComponent {
  kind: "static";
  content: string;
}

export interface DynamicPathComponent {
  kind: "dynamic";
  name: string;
  type: Type;
  description: string;
}

export interface Headers {
  [name: string]: Header;
}

export interface Header {
  headerFieldName: string;
  description: string;
  type: Type;
}

export interface QueryParamComponent {
  name: string;
  type: Type;
}

export interface SpecificError {
  statusCode: number;
  type: Type;
}

export type Type =
  | VoidType
  | NullType
  | BooleanType
  | BooleanConstantType
  | StringType
  | StringConstantType
  | NumberType
  | Int32Type
  | Int64Type
  | FloatType
  | DoubleType
  | IntegerConstantType
  | ObjectType
  | ArrayType
  | OptionalType
  | UnionType
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

export function booleanConstant(value: boolean): BooleanConstantType {
  return {
    kind: "boolean-constant",
    value
  };
}

export interface BooleanConstantType {
  kind: "boolean-constant";
  value: boolean;
}

export const STRING: StringType = {
  kind: "string"
};

export interface StringType {
  kind: "string";
}

export function stringConstant(value: string): StringConstantType {
  return {
    kind: "string-constant",
    value
  };
}

export interface StringConstantType {
  kind: "string-constant";
  value: string;
}

export const NUMBER: NumberType = {
  kind: "number"
};

export interface NumberType {
  kind: "number";
}

export function integerConstant(value: number): IntegerConstantType {
  if (value !== Math.round(value)) {
    throw new Error(`Invalid integer: ${value}`);
  }
  return {
    kind: "integer-constant",
    value
  };
}

export interface IntegerConstantType {
  kind: "integer-constant";
  value: number;
}

export const INT32: Int32Type = {
  kind: "int32"
};

export const INT64: Int64Type = {
  kind: "int64"
};

export const FLOAT: FloatType = {
  kind: "float"
};

export const DOUBLE: DoubleType = {
  kind: "double"
};

export interface Int32Type {
  kind: "int32";
}

export interface Int64Type {
  kind: "int64";
}

export interface FloatType {
  kind: "float";
}

export interface DoubleType {
  kind: "double";
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

export function unionType(...types: Type[]): Type {
  types = uniq(
    types.map(extractPossibleTypes).reduce((acc, curr) => [...acc, ...curr], [])
  );
  if (types.length === 0) {
    return VOID;
  } else if (types.length === 1) {
    return types[0];
  } else {
    return {
      kind: "union",
      types
    };
  }
}

function extractPossibleTypes(type: Type): Type[] {
  if (type.kind === "union") {
    return type.types
      .map(extractPossibleTypes)
      .reduce((acc, curr) => [...acc, ...curr], []);
  }
  return [type];
}

export interface UnionType {
  kind: "union";
  types: Type[];
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
