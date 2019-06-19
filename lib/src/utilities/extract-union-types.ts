import assertNever from "assert-never";
import { flatten } from "lodash";
import { TypeNode } from "../models/nodes";
import { DataType, TypeKind, UnionType } from "../models/types";

export function extractNestedUnionTypes(
  type: DataType,
  name = ""
): Array<TypeNode<UnionType>> {
  switch (type.kind) {
    case TypeKind.NULL:
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
    case TypeKind.TYPE_REFERENCE:
      return [];
    case TypeKind.OBJECT:
      return flatten(
        type.properties.map(property =>
          extractNestedUnionTypes(property.type, name + "." + property.name)
        )
      );
    case TypeKind.ARRAY:
      return extractNestedUnionTypes(type.elements, name);
    case TypeKind.UNION:
      return flatten([
        {
          name,
          type
        },
        ...type.types.map((possibleType, index) =>
          extractNestedUnionTypes(possibleType, `${name}[${index}]`)
        )
      ]);
    default:
      throw assertNever(type);
  }
}
