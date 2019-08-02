import assertNever from "assert-never";
import { flatten } from "lodash";
import { TypeNode } from "../models/nodes";
import { ObjectType, TypeKind, UnionType } from "../models/types";
import { resolveType } from "../verifiers/utilities/type-resolver";

/**
 * Recursively traverse the Types tree, find and group union types definitions into a flat array.
 */
export function extractNestedUnionTypes(
  { type, name = "" }: TypeNode,
  typeStore: TypeNode[]
): Array<TypeNode<UnionType>> {
  switch (type.kind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return [];
    case TypeKind.TYPE_REFERENCE:
      return extractNestedUnionTypes(
        { name, type: resolveType(type, typeStore) },
        typeStore
      );
    case TypeKind.OBJECT:
      return flatten(
        type.properties.map(property =>
          extractNestedUnionTypes(
            {
              type: property.type,
              name: name + "." + property.name
            },
            typeStore
          )
        )
      );
    case TypeKind.ARRAY:
      return extractNestedUnionTypes({ type: type.elements, name }, typeStore);
    case TypeKind.UNION:
      return flatten([
        {
          name,
          type
        },
        ...type.types.map((possibleType, index) =>
          extractNestedUnionTypes(
            {
              type: possibleType,
              name: `${name}[${index}]`
            },
            typeStore
          )
        )
      ]);
    default:
      throw assertNever(type);
  }
}

/**
 * Recursively traverse the Types tree, find and group union types definitions into a flat array.
 */
export function extractNestedObjectTypes(
  typeNode: TypeNode,
  typeStore: TypeNode[]
): Array<TypeNode<ObjectType>> {
  const { type, name } = typeNode;
  switch (type.kind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return [];
    case TypeKind.TYPE_REFERENCE:
      return extractNestedObjectTypes(
        { name, type: resolveType(type, typeStore) },
        typeStore
      );
    case TypeKind.OBJECT:
      return flatten([
        {
          name,
          type
        },
        ...type.properties.map(property =>
          extractNestedObjectTypes(
            {
              type: property.type,
              name: name + "." + property.name
            },
            typeStore
          )
        )
      ]);
    case TypeKind.ARRAY:
      return extractNestedObjectTypes({ type: type.elements, name }, typeStore);
    case TypeKind.UNION:
      return flatten(
        type.types.map((possibleType, index) =>
          extractNestedObjectTypes(
            {
              type: possibleType,
              name: `${name}[${index}]`
            },
            typeStore
          )
        )
      );
    default:
      throw assertNever(type);
  }
}
