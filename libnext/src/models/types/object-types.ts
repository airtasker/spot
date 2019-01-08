import { Kind } from "./kinds";
import { DataType } from ".";

export interface ObjectType {
  kind: Kind.Object;
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
    kind: Kind.Object,
    properties
  };
}

export interface ArrayType {
  kind: Kind.Array;
  elements: DataType;
}

export function arrayType(elementType: DataType): ArrayType {
  return {
    kind: Kind.Array,
    elements: elementType
  };
}
