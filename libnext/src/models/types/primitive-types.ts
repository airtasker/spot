import { Kind } from "./kinds";

/** Primitive types native to the typescript language */
export type PrimitiveType = NullType | BooleanType | StringType | NumberType;

export const NULL: NullType = {
  kind: Kind.Null
};

export interface NullType {
  kind: Kind.Null;
}

export const BOOLEAN: BooleanType = {
  kind: Kind.Boolean
};

export interface BooleanType {
  kind: Kind.Boolean;
}

export const STRING: StringType = {
  kind: Kind.String
};

export interface StringType {
  kind: Kind.String;
}

export const NUMBER: NumberType = {
  kind: Kind.Number
};

export interface NumberType {
  kind: Kind.Number;
}
