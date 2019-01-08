import {
  PrimitiveLiteral,
  NumberLiteral,
  StringLiteral
} from "./primitive-literals";
import {
  PrimitiveType,
  NullType,
  StringType,
  NumberType
} from "./primitive-types";
import { ObjectType, ArrayType } from "./object-types";
import {
  ObjectReferenceType,
  UnionType,
  ReferenceType,
  StringReferenceType,
  NumberReferenceType,
  PrimitiveReferenceType
} from "./special-types";
import { Kind } from "./kinds";

export * from "./kinds";
export * from "./primitive-types";
export * from "./primitive-literals";
export * from "./special-types";
export * from "./object-types";

export type DataType =
  | PrimitiveType
  | PrimitiveLiteral
  | ObjectType
  | ArrayType
  | ReferenceType
  | UnionType;

export type AliasablePrimitiveType = Exclude<PrimitiveType, NullType>;
export type StringLikeType = StringType | StringReferenceType | StringLiteral;
export type NumberLikeType = NumberType | NumberReferenceType | NumberLiteral;

export function isObjectType(type: DataType): type is ObjectType {
  return type.kind === Kind.Object;
}

export function isStringLikeType(type: DataType): type is StringLikeType {
  return [Kind.String, Kind.StringReference, Kind.StringLiteral].includes(
    type.kind
  );
}

export function isNumberLikeType(type: DataType): type is NumberLikeType {
  return [Kind.Number, Kind.NumberReference, Kind.NumberLiteral].includes(
    type.kind
  );
}

export function isAliasablePrimitiveType(
  type: DataType
): type is AliasablePrimitiveType {
  return [Kind.Boolean, Kind.String, Kind.Number].includes(type.kind);
}

export function isReferenceType(type: DataType): type is ReferenceType {
  return [
    Kind.BooleanReference,
    Kind.StringReference,
    Kind.NumberReference,
    Kind.ObjectReference
  ].includes(type.kind);
}

export function isPrimitiveReferenceType(
  type: DataType
): type is PrimitiveReferenceType {
  return [
    Kind.BooleanReference,
    Kind.StringReference,
    Kind.NumberReference
  ].includes(type.kind);
}

export function isObjectReferenceType(
  type: DataType
): type is ObjectReferenceType {
  return type.kind === Kind.ObjectReference;
}

export function isArrayType(type: DataType): type is ArrayType {
  return type.kind === Kind.Array;
}

export function isUnionType(type: DataType): type is UnionType {
  return type.kind === Kind.Union;
}
