export enum TypeKind {
  NULL = "null",
  BOOLEAN = "boolean",
  STRING = "string",
  NUMBER = "number",
  INTEGER = "integer",
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

export const StringLikeKind = [
  TypeKind.STRING,
  TypeKind.STRING_LITERAL,
  TypeKind.DATE,
  TypeKind.DATE_TIME
];

export const NumberLikeKind = [
  TypeKind.NUMBER,
  TypeKind.NUMBER_LITERAL,
  TypeKind.INTEGER
];

export const BooleanLikeKind = [TypeKind.BOOLEAN, TypeKind.BOOLEAN_LITERAL];
