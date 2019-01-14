import { TypeKind } from "./kinds";

export type CustomPrimitiveType = IntegerType | DateType | DateTimeType;

export const INTEGER: IntegerType = {
  kind: TypeKind.INTEGER
};

export interface IntegerType {
  kind: TypeKind.INTEGER;
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
