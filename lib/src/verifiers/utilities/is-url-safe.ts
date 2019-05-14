import assertNever from "assert-never";
import { NotReferenceTypeKind, TypeKind } from "../../models/types";

/**
 * Returns whether a type kind corresponds to a type that can be safely represented in a URL.
 *
 * You should call `resolveType()` prior to ensure the type is not a reference kind.
 */
export function isUrlSafe(typeKind: NotReferenceTypeKind): boolean {
  switch (typeKind) {
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.FLOAT:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return true;
    case TypeKind.NULL:
    case TypeKind.OBJECT:
    case TypeKind.ARRAY:
    case TypeKind.UNION:
      return false;
    default:
      throw assertNever(typeKind);
  }
}
