import assertNever from "assert-never";
import { dereferenceType, Type, TypeKind, TypeTable } from "./types";

/**
 * Check if a type is safe for use as a path parameter.
 *
 * @param type type to check
 * @param typeTable type lookup table
 */
export function isPathParamTypeSafe(type: Type, typeTable: TypeTable): boolean {
  switch (type.kind) {
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.NULL:
    case TypeKind.OBJECT:
      return false;
    case TypeKind.ARRAY:
      return isParamArrayElementTypeSafe(type.elementType, typeTable);
    case TypeKind.UNION:
      return type.types.every(t => isPathParamTypeSafe(t, typeTable));
    case TypeKind.REFERENCE:
      return isPathParamTypeSafe(dereferenceType(type, typeTable), typeTable);
    default:
      throw assertNever(type);
  }
}

/**
 * Check if a type is safe for use as a query parameter.
 *
 * @param type type to check
 * @param typeTable type lookup table
 */
export function isQueryParamTypeSafe(
  type: Type,
  typeTable: TypeTable
): boolean {
  switch (type.kind) {
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.NULL:
      return false;
    case TypeKind.ARRAY:
      return isParamArrayElementTypeSafe(type.elementType, typeTable);
    case TypeKind.OBJECT:
      return type.properties.every(p =>
        isParamObjectPropertyTypeSafe(p.type, typeTable)
      );
    case TypeKind.UNION:
      return type.types.every(t => isQueryParamTypeSafe(t, typeTable));
    case TypeKind.REFERENCE:
      return isQueryParamTypeSafe(dereferenceType(type, typeTable), typeTable);
    default:
      throw assertNever(type);
  }
}

/**
 * Check if a type is safe for use as a header type.
 *
 * @param type type to check
 * @param typeTable type lookup table
 */
export function isHeaderTypeSafe(type: Type, typeTable: TypeTable): boolean {
  switch (type.kind) {
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.ARRAY:
    case TypeKind.OBJECT:
      return false;
    case TypeKind.UNION:
      return type.types.every(t => isHeaderTypeSafe(t, typeTable));
    case TypeKind.REFERENCE:
      return isHeaderTypeSafe(dereferenceType(type, typeTable), typeTable);
    default:
      throw assertNever(type);
  }
}

/**
 * Check if a type is safe for use as an parameter's object property type.
 *
 * @param type type to check
 * @param typeTable type lookup table
 */
function isParamObjectPropertyTypeSafe(
  type: Type,
  typeTable: TypeTable
): boolean {
  switch (type.kind) {
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.NULL:
    case TypeKind.ARRAY:
    case TypeKind.OBJECT:
      return false;
    case TypeKind.UNION:
      return type.types.every(t => isParamObjectPropertyTypeSafe(t, typeTable));
    case TypeKind.REFERENCE:
      return isParamObjectPropertyTypeSafe(
        dereferenceType(type, typeTable),
        typeTable
      );
    default:
      throw assertNever(type);
  }
}

/**
 * Check if a type is safe for use as a parameter's array element type.
 *
 * @param type type to check
 * @param typeTable type lookup table
 */
function isParamArrayElementTypeSafe(
  type: Type,
  typeTable: TypeTable
): boolean {
  switch (type.kind) {
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.NULL:
    case TypeKind.ARRAY:
    case TypeKind.OBJECT:
      return false;
    case TypeKind.UNION:
      return type.types.every(t => isParamArrayElementTypeSafe(t, typeTable));
    case TypeKind.REFERENCE:
      return isParamArrayElementTypeSafe(
        dereferenceType(type, typeTable),
        typeTable
      );
    default:
      throw assertNever(type);
  }
}
