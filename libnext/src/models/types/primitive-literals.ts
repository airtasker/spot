import { Kind } from "./kinds";

export type PrimitiveLiteral = BooleanLiteral | StringLiteral | NumberLiteral;

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

export function numberLiteral(value: number): NumberLiteral {
  return {
    kind: Kind.NumberLiteral,
    value
  };
}

export interface NumberLiteral {
  kind: Kind.NumberLiteral;
  value: number;
}
