import { DataType } from ".";
import { TypeDefinition } from "../definitions";
import { TypeKind } from "./kinds";

export function resolveType(types: TypeDefinition[], type: DataType): DataType {
  switch (type.kind) {
    case TypeKind.TYPE_REFERENCE:
      const resolvedType = types.find(t => t.name === type.name);
      if (!resolvedType) {
        throw new Error(`Found a reference to missing type ${type.name}`);
      }
      return resolvedType.type;
    default:
      return type;
  }
}
