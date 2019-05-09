import { TypeKind } from "./kinds";

export type CustomPrimitiveType =
  | Int32Type
  | Int64Type
  | DateType
  | DateTimeType;

export const INT32: Int32Type = {
  kind: TypeKind.INT32
};

export interface Int32Type {
  kind: TypeKind.INT32;
}

export const INT64: Int64Type = {
  kind: TypeKind.INT64
};

export interface Int64Type {
  kind: TypeKind.INT64;
}

export const DATE: DateType = {
  kind: TypeKind.DATE
};

export interface DateType {
  kind: TypeKind.DATE;
}

export const DATETIME: DateTimeType = {
  kind: TypeKind.DATE_TIME
};

export interface DateTimeType {
  kind: TypeKind.DATE_TIME;
}
