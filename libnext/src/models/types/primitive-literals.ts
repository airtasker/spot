import { TypeKind } from "./kinds";

export type PrimitiveLiteral = BooleanLiteral | StringLiteral | NumberLiteral;

export function booleanLiteral(value: boolean): BooleanLiteral {
  return {
    kind: TypeKind.BOOLEAN_LITERAL,
    value
  };
}

export interface BooleanLiteral {
  kind: TypeKind.BOOLEAN_LITERAL;
  value: boolean;
}

export function stringLiteral(value: string): StringLiteral {
  return {
    kind: TypeKind.STRING_LITERAL,
    value
  };
}

export interface StringLiteral {
  kind: TypeKind.STRING_LITERAL;
  value: string;
}

export function numberLiteral(value: number): NumberLiteral {
  return {
    kind: TypeKind.NUMBER_LITERAL,
    value
  };
}

export interface NumberLiteral {
  kind: TypeKind.NUMBER_LITERAL;
  value: number;
}
