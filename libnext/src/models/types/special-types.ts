import { DataType } from ".";
import { Kind } from "./kinds";

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
