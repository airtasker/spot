import { TypeNode } from "../models/nodes";
import { TypeKind, UnionType } from "../models/types";

export function isUnionOfStringLiterals(
  typeNode: TypeNode<UnionType>
): boolean {
  return (
    typeNode.type.types.filter(type => type.kind !== TypeKind.STRING_LITERAL).length === 0
  );
}
