enum TypeKind {
  NULL = "null",
  BOOLEAN = "boolean",
  BOOLEAN_LITERAL = "boolean-literal",
  STRING = "string",
  STRING_LITERAL = "string-literal",
  FLOAT = "float",
  DOUBLE = "double",
  FLOAT_LITERAL = "float-literal",
  INT32 = "int32",
  INT64 = "int64",
  INT_LITERAL = "integer-literal",
  DATE = "date",
  DATE_TIME = "date-time",
  OBJECT = "object",
  ARRAY = "array",
  UNION = "union",
  REFERENCE = "reference"
}

export type Type =
  | NullType
  | BooleanType
  | BooleanLiteralType
  | StringType
  | StringLiteralType
  | FloatType
  | DoubleType
  | FloatLiteralType
  | Int32Type
  | Int64Type
  | IntLiteralType
  | DateType
  | DateTimeType
  | ObjectType
  | ArrayType
  | UnionType
  | ReferenceType;

export interface NullType {
  kind: TypeKind.NULL;
}

export interface BooleanType {
  kind: TypeKind.BOOLEAN;
}

export interface BooleanLiteralType {
  kind: TypeKind.BOOLEAN_LITERAL;
  value: boolean;
}

export interface StringType {
  kind: TypeKind.STRING;
}

export interface StringLiteralType {
  kind: TypeKind.STRING_LITERAL;
  value: string;
}

export interface FloatType {
  kind: TypeKind.FLOAT;
}

export interface DoubleType {
  kind: TypeKind.DOUBLE;
}

export interface FloatLiteralType {
  kind: TypeKind.FLOAT_LITERAL;
  value: number;
}

export interface Int32Type {
  kind: TypeKind.INT32;
}

export interface Int64Type {
  kind: TypeKind.INT64;
}

export interface IntLiteralType {
  kind: TypeKind.INT_LITERAL;
  value: number;
}

export interface DateType {
  kind: TypeKind.DATE;
}

export interface DateTimeType {
  kind: TypeKind.DATE_TIME;
}

export interface ObjectType {
  kind: TypeKind.OBJECT;
  properties: Array<{
    name: string;
    description?: string;
    optional: boolean;
    type: Type;
  }>;
}

export interface ArrayType {
  kind: TypeKind.ARRAY;
  elementType: Type;
}

export interface UnionType {
  kind: TypeKind.UNION;
  types: Type[];
}

export interface ReferenceType {
  kind: TypeKind.REFERENCE;
  name: string;
}

export function nullType(): NullType {
  return {
    kind: TypeKind.NULL
  };
}

export function booleanType(): BooleanType {
  return {
    kind: TypeKind.BOOLEAN
  };
}

export function booleanLiteralType(value: boolean): BooleanLiteralType {
  return {
    kind: TypeKind.BOOLEAN_LITERAL,
    value
  };
}

export function stringType(): StringType {
  return {
    kind: TypeKind.STRING
  };
}

export function stringLiteralType(value: string): StringLiteralType {
  return {
    kind: TypeKind.STRING_LITERAL,
    value
  };
}

export function floatType(): FloatType {
  return {
    kind: TypeKind.FLOAT
  };
}

export function doubleType(): DoubleType {
  return {
    kind: TypeKind.DOUBLE
  };
}

export function floatLiteralType(value: number): FloatLiteralType {
  return {
    kind: TypeKind.FLOAT_LITERAL,
    value
  };
}

export function int32Type(): Int32Type {
  return {
    kind: TypeKind.INT32
  };
}

export function int64Type(): Int64Type {
  return {
    kind: TypeKind.INT64
  };
}

export function intLiteralType(value: number): IntLiteralType {
  return {
    kind: TypeKind.INT_LITERAL,
    value
  };
}

export function dateType(): DateType {
  return {
    kind: TypeKind.DATE
  };
}

export function dateTimeType(): DateTimeType {
  return {
    kind: TypeKind.DATE_TIME
  };
}

export function objectType(
  properties: Array<{
    name: string;
    description?: string;
    optional: boolean;
    type: Type;
  }>
): ObjectType {
  return {
    kind: TypeKind.OBJECT,
    properties
  };
}

export function arrayType(elementType: Type): ArrayType {
  return {
    kind: TypeKind.ARRAY,
    elementType
  };
}

export function unionType(unionTypes: Type[]): UnionType {
  return {
    kind: TypeKind.UNION,
    types: unionTypes
  };
}

export function referenceType(name: string): ReferenceType {
  return {
    kind: TypeKind.REFERENCE,
    name
  };
}
