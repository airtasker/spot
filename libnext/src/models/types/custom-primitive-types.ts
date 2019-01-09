import { Kind } from "./kinds";

export type CustomPrimitiveType = IntegerType | DateType | DateTimeType;

export const INTEGER: IntegerType = {
  kind: Kind.Integer
};

export interface IntegerType {
  kind: Kind.Integer;
}

export const DATE: DateType = {
  kind: Kind.Date
};

export interface DateType {
  kind: Kind.Date;
}

export const DATETIME: DateTimeType = {
  kind: Kind.DateTime
};

export interface DateTimeType {
  kind: Kind.DateTime;
}
