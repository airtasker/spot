import {
  CustomPrimitiveType,
  DateTimeType,
  DateType,
  IntegerType
} from "./custom-primitive-types";
import { Kind } from "./kinds";
import { ArrayType, ObjectType } from "./object-types";
import {
  NumberLiteral,
  PrimitiveLiteral,
  StringLiteral
} from "./primitive-literals";
import { NumberType, PrimitiveType, StringType } from "./primitive-types";
import { ReferenceType, UnionType } from "./special-types";

export * from "./custom-primitive-types";
export * from "./kinds";
export * from "./object-types";
export * from "./primitive-literals";
export * from "./primitive-types";
export * from "./special-types";

export type DataType =
  | PrimitiveType
  | CustomPrimitiveType
  | PrimitiveLiteral
  | ObjectType
  | ArrayType
  | ReferenceType
  | UnionType;

export type NumberLikeType =
  | NumberType
  | NumberLiteral
  | IntegerType
  | ReferenceType;

export type StringLikeType =
  | StringType
  | StringLiteral
  | DateType
  | DateTimeType
  | ReferenceType;

export function isObjectType(type: DataType): type is ObjectType {
  return type.kind === Kind.Object;
}

export function isArrayType(type: DataType): type is ArrayType {
  return type.kind === Kind.Array;
}

export function isUnionType(type: DataType): type is UnionType {
  return type.kind === Kind.Union;
}

export function isReferenceType(type: DataType): type is ReferenceType {
  return type.kind === Kind.TypeReference;
}
