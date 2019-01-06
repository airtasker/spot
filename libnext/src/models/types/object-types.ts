import { Kind } from "./kinds";
import { DataType } from ".";
import { ReferenceType } from "./special-types";

export interface ObjectType {
  kind: Kind.Object;
  properties: ObjectTypeProperty[];
  extends: ReferenceType[];
}

export interface ObjectTypeProperty {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export function objectType(
  properties: ObjectTypeProperty[],
  extendsTypes: ReferenceType[] = []
): ObjectType {
  return {
    kind: Kind.Object,
    properties,
    extends: extendsTypes
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
