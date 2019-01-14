import { DataType } from ".";
import { TypeKind } from "./kinds";

export interface UnionType {
  kind: TypeKind.UNION;
  types: DataType[];
}

export function unionType(unionTypes: DataType[]): UnionType {
  return {
    kind: TypeKind.UNION,
    types: unionTypes
  };
}

export interface ReferenceType {
  kind: TypeKind.TYPE_REFERENCE;
  referenceKind: TypeKind;
  name: string;
  /** The absolute path to the file that contains the declaration of the reference */
  location: string;
}

export function referenceType(
  name: string,
  location: string,
  referenceKind: TypeKind
): ReferenceType {
  return {
    kind: TypeKind.TYPE_REFERENCE,
    referenceKind,
    name,
    location
  };
}
