import { TypeKind } from "./kinds";

export type DataExpression =
  | NullExpression
  | BooleanExpression
  | StringExpression
  | NumberExpression
  | ArrayExpression
  | ObjectExpression;

export function nullExpression(): NullExpression {
  return {
    kind: TypeKind.NULL
  };
}

export interface NullExpression {
  kind: TypeKind.NULL;
}

export function booleanExpression(value: boolean): BooleanExpression {
  return {
    kind: TypeKind.BOOLEAN_LITERAL,
    value
  };
}

export interface BooleanExpression {
  kind: TypeKind.BOOLEAN_LITERAL;
  value: boolean;
}

export function stringExpression(value: string): StringExpression {
  return {
    kind: TypeKind.STRING_LITERAL,
    value
  };
}

export interface StringExpression {
  kind: TypeKind.STRING_LITERAL;
  value: string;
}

export function numberExpression(value: number): NumberExpression {
  return {
    kind: TypeKind.NUMBER_LITERAL,
    value
  };
}

export interface NumberExpression {
  kind: TypeKind.NUMBER_LITERAL;
  value: number;
}

export function arrayExpression(elements: DataExpression[]): ArrayExpression {
  return {
    kind: TypeKind.ARRAY,
    elements
  };
}

export interface ArrayExpression {
  kind: TypeKind.ARRAY;
  elements: DataExpression[];
}

export function objectExpression(
  properties: ObjectExpressionProperty[]
): ObjectExpression {
  return {
    kind: TypeKind.OBJECT,
    properties
  };
}

export interface ObjectExpression {
  kind: TypeKind.OBJECT;
  properties: ObjectExpressionProperty[];
}

export interface ObjectExpressionProperty {
  name: string;
  expression: DataExpression;
}
