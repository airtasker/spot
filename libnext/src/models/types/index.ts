import {
  CustomPrimitiveType,
  DateTimeType,
  DateType,
  IntegerType
} from "./custom-primitive-types";
import { TypeKind } from "./kinds";
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
  return type.kind === TypeKind.OBJECT;
}

export function isArrayType(type: DataType): type is ArrayType {
  return type.kind === TypeKind.ARRAY;
}

export function isUnionType(type: DataType): type is UnionType {
  return type.kind === TypeKind.UNION;
}

export function isReferenceType(type: DataType): type is ReferenceType {
  return type.kind === TypeKind.TYPE_REFERENCE;
}
