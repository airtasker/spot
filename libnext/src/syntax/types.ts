/**
 * Used to mark an internally defined custom primitive type.
 * @private
 */
export interface InternalCustomPrimitiveType {}

export type CustomPrimitiveType = CustomStringType | CustomNumberType;

/** Base type for custom strings. This is intended to be extended. */
export interface CustomStringType {
  /** Regular expression constraint */
  pattern: string;
}

/** Base type for custom numbers. This is intended to be extended. */
export interface CustomNumberType {
  /** Integer contraint */
  integer: boolean;

  /** Min value constraint */
  min: number;

  /** Max value constraint */
  max: number;
}

/** 32 bit signed integers */
export interface Int32 extends CustomNumberType, InternalCustomPrimitiveType {
  integer: true;
  min: -2147483648;
  max: 2147483647;
}

/** 64 bit signed integers */
export interface Int64 extends CustomNumberType, InternalCustomPrimitiveType {
  integer: true;
  // min: -9223372036854775808; omitted due to javascript rounding errors
  // max: 9223372036854775807; omitted due to javascript rounding errors
}

/** Single precision floating point numbers (32 bit) */
export interface Float extends CustomNumberType, InternalCustomPrimitiveType {}

/** Double precision floating point numbers (64 bit) */
export interface Double extends CustomNumberType, InternalCustomPrimitiveType {}

/**
 * A `full-date` as defined by https://tools.ietf.org/html/rfc3339#section-5.6
 *
 * @example
 * 2018-08-24
 */
export interface Date extends CustomStringType, InternalCustomPrimitiveType {
  pattern: "^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$";
}

/**
 * A `date-time` as defined by https://tools.ietf.org/html/rfc3339#section-5.6
 *
 * @example
 * 2018-08-24T21:18:36Z
 */
export interface DateTime
  extends CustomStringType,
    InternalCustomPrimitiveType {
  pattern: "^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$";
}
