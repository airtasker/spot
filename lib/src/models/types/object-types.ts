import { DataType } from ".";
import { TypeKind } from "./kinds";

export interface ObjectType {
  kind: TypeKind.OBJECT;
  properties: ObjectTypeProperty[];
}

export interface ObjectTypeProperty {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export function objectType(properties: ObjectTypeProperty[]): ObjectType {
  return {
    kind: TypeKind.OBJECT,
    properties
  };
}

export interface ArrayType {
  kind: TypeKind.ARRAY;
  elements: DataType;
}

export function arrayType(elementType: DataType): ArrayType {
  return {
    kind: TypeKind.ARRAY,
    elements: elementType
  };
}
