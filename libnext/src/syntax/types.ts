/** 32 bit signed integers */
export type Int32 = number;

/** 64 bit signed integers */
export type Int64 = number;

/** Single precision floating point numbers (32 bit) */
export type Float = number;

/** Double precision floating point numbers (64 bit) */
export type Double = number;

/**
 * A `full-date` as defined by https://tools.ietf.org/html/rfc3339#section-5.6
 *
 * @example
 * 2018-08-24
 */
export type Date = string;

/**
 * A `date-time` as defined by https://tools.ietf.org/html/rfc3339#section-5.6
 *
 * @example
 * 2018-08-24T21:18:36Z
 */
export type DateTime = string;
