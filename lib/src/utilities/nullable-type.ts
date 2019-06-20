import { TypeNode } from "../models/nodes";
import { TypeKind, UnionType } from "../models/types";

export function isUnionOfSingleTypeWithNull(
  typeNode: TypeNode<UnionType>
): boolean {
  return (
    typeNode.type.types.filter(type => type.kind !== TypeKind.NULL).length === 1
  );
}
