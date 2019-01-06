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
  kind: Kind.Reference;
  name: string;
}

export function referenceType(name: string): ReferenceType {
  return {
    kind: Kind.Reference,
    name
  };
}
