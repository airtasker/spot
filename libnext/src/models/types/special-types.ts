import { Kind } from "./kinds";
import { DataType } from ".";

export interface UnionType {
  kind: Kind.Union;
  types: DataType[];
}

export function unionType(unionTypes: DataType[]): UnionType {
  return {
    kind: Kind.Union,
    types: unionTypes
  };
}

export interface ObjectReferenceType extends BaseReferenceType {
  kind: Kind.ObjectReference;
}

export function objectReferenceType(
  name: string,
  location: string
): ObjectReferenceType {
  return {
    kind: Kind.ObjectReference,
    name,
    location
  };
}

export interface BooleanReferenceType extends BaseReferenceType {
  kind: Kind.BooleanReference;
}

export function booleanReference(
  name: string,
  location: string
): BooleanReferenceType {
  return {
    kind: Kind.BooleanReference,
    name,
    location
  };
}

export interface StringReferenceType extends BaseReferenceType {
  kind: Kind.StringReference;
}

export function stringReference(
  name: string,
  location: string
): StringReferenceType {
  return {
    kind: Kind.StringReference,
    name,
    location
  };
}

export interface NumberReferenceType extends BaseReferenceType {
  kind: Kind.NumberReference;
}

export function numberReference(
  name: string,
  location: string
): NumberReferenceType {
  return {
    kind: Kind.NumberReference,
    name,
    location
  };
}

export type PrimitiveReferenceType =
  | BooleanReferenceType
  | StringReferenceType
  | NumberReferenceType;

export type ReferenceType = PrimitiveReferenceType | ObjectReferenceType;

interface BaseReferenceType {
  name: string;
  location: string;
}
