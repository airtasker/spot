import { Kind } from "./kinds";

export type CustomPrimitiveType = CustomStringType | CustomNumberType;

export interface CustomStringType {
  kind: Kind.CustomString;
  pattern?: string;
}

export function customString(
  opts: { pattern?: string } = {}
): CustomStringType {
  return {
    kind: Kind.CustomString,
    pattern: opts.pattern
  };
}

export interface CustomNumberType {
  kind: Kind.CustomNumber;
  integer?: boolean;
  min?: number;
  max?: number;
}

export function customNumber(
  opts: {
    integer?: boolean;
    min?: number;
    max?: number;
  } = {}
): CustomNumberType {
  return {
    kind: Kind.CustomNumber,
    integer: opts.integer,
    min: opts.min,
    max: opts.max
  };
}
