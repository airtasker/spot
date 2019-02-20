import assertNever from "assert-never";
import { NotReferenceTypeKind, TypeKind } from "lib/src/models/types";

/**
 * Returns whether a type kind corresponds to a primitive type.
 *
 * Note that a reference type is not considered to be primitive. You should
 * call `resolveType()` prior.
 */
export function isPrimitiveType(typeKind: NotReferenceTypeKind): boolean {
  switch (typeKind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.NUMBER:
    case TypeKind.INTEGER:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return true;
    case TypeKind.OBJECT:
    case TypeKind.ARRAY:
    case TypeKind.UNION:
      return false;
    default:
      throw assertNever(typeKind);
  }
}
