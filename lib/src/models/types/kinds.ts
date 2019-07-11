export enum TypeKind {
  NULL = "null",
  BOOLEAN = "boolean",
  STRING = "string",
  FLOAT = "float",
  DOUBLE = "double",
  INT32 = "int32",
  INT64 = "int64",
  DATE = "date",
  DATE_TIME = "date-time",
  BOOLEAN_LITERAL = "boolean-literal",
  STRING_LITERAL = "string-literal",
  NUMBER_LITERAL = "number-literal",
  OBJECT = "object",
  ARRAY = "array",
  UNION = "union",
  TYPE_REFERENCE = "type-reference"
}

export type NotReferenceTypeKind = Exclude<TypeKind, TypeKind.TYPE_REFERENCE>;

export const StringLikeKind = [
  TypeKind.STRING,
  TypeKind.STRING_LITERAL,
  TypeKind.DATE,
  TypeKind.DATE_TIME
];

export const NumberLikeKind = [
  TypeKind.FLOAT,
  TypeKind.DOUBLE,
  TypeKind.INT32,
  TypeKind.INT64,
  TypeKind.NUMBER_LITERAL
];

export const BooleanLikeKind = [TypeKind.BOOLEAN, TypeKind.BOOLEAN_LITERAL];
