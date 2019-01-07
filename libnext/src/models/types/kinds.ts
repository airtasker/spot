export enum Kind {
  Null = "null",
  Boolean = "boolean",
  String = "string",
  Number = "number",
  BooleanLiteral = "boolean-literal",
  StringLiteral = "string-literal",
  NumberLiteral = "number-literal",
  CustomString = "custom-string",
  CustomNumber = "custom-number",
  Object = "object",
  Array = "array",
  Reference = "reference",
  Union = "union"
}
export const KindOfString = [Kind.String, Kind.CustomString];
export const KindOfNumber = [Kind.Number, Kind.CustomNumber];
