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

export interface ReferenceType {
  kind: Kind.TypeReference;
  referenceKind: Kind;
  name: string;
  location: string;
}

export function referenceType(
  name: string,
  location: string,
  referenceKind: Kind
): ReferenceType {
  return {
    kind: Kind.TypeReference,
    referenceKind,
    name,
    location
  };
}
