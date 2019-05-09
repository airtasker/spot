import { TypeKind } from "./kinds";

/** Primitive types native to the TypeScript language. */
export type PrimitiveType = NullType | BooleanType | StringType | FloatType;

export const NULL: NullType = {
  kind: TypeKind.NULL
};

export interface NullType {
  kind: TypeKind.NULL;
}

export const BOOLEAN: BooleanType = {
  kind: TypeKind.BOOLEAN
};

export interface BooleanType {
  kind: TypeKind.BOOLEAN;
}

export const STRING: StringType = {
  kind: TypeKind.STRING
};

export interface StringType {
  kind: TypeKind.STRING;
}

export const FLOAT: FloatType = {
  kind: TypeKind.FLOAT
};

export interface FloatType {
  kind: TypeKind.FLOAT;
}
