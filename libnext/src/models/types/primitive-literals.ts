import { Kind } from "./kinds";

export type PrimitiveLiteral = BooleanLiteral | StringLiteral | IntegerLiteral;

export function booleanLiteral(value: boolean): BooleanLiteral {
  return {
    kind: Kind.BooleanLiteral,
    value
  };
}

export interface BooleanLiteral {
  kind: Kind.BooleanLiteral;
  value: boolean;
}

export function stringLiteral(value: string): StringLiteral {
  return {
    kind: Kind.StringLiteral,
    value
  };
}

export interface StringLiteral {
  kind: Kind.StringLiteral;
  value: string;
}

export function integerLiteral(value: number): IntegerLiteral {
  if (value !== Math.round(value)) {
    throw new Error(`Invalid integer: ${value}`);
  }
  return {
    kind: Kind.NumberLiteral,
    value
  };
}

export interface IntegerLiteral {
  kind: Kind.NumberLiteral;
  value: number;
}
