/**
 * `KeyOfType` returns keys of type `KeyType` from type `T`. It is similar
 * to TypeScript's `keyof` but additionally constrains by key type.
 */
export type KeyOfType<T, KeyType> = {
  [P in keyof Required<T>]: Required<T>[P] extends KeyType ? P : never;
}[keyof T];

/**
 * `PickByType` creates a new type with properties from type `T` which
 * extend type `KeyType`. It is similar to TypeScript's `Pick` but selecting
 * by key type instead of key names
 */
export type PickByType<T, KeyType> = Pick<
  T,
  Extract<keyof T, KeyOfType<T, KeyType>>
>;

/**
 * `OmitByType` creates a new type without properties from type `T` which
 * extend type `KeyType`. It is similar to TypeScript's `Omit` but selecting
 * by key type instead of key name.
 */
export type OmitByType<T, KeyType> = Pick<
  T,
  Exclude<keyof T, KeyOfType<T, KeyType>>
>;

/**
 * Result mimics the Rust's result type
 */
export type Result<T, E extends Error> = Ok<T> | Err<E>;
type NotError<T> = T extends Error ? never : T;

export function isOk<T, E extends Error>(
  result: Result<T, E>
): result is Ok<T> {
  return result.isOk();
}

export function isErr<T, E extends Error>(
  result: Result<T, E>
): result is Err<E> {
  return result.isErr();
}

export function ok<T>(value: NotError<T>): Ok<T> {
  return new Ok(value);
}

export function err<E extends Error>(error: E): Err<E> {
  return new Err(error);
}

export function tryCatch<T, E extends Error>(
  op: () => NotError<T>
): Result<T, E> {
  try {
    return ok(op());
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return err(e);
  }
}

class Ok<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): boolean {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  /**
   * Used mostly with tests
   */
  unwrapOrThrow(): T {
    return this.value;
  }

  /**
   * Used mostly with tests
   */
  unwrapErrOrThrow(): never {
    throw new Error();
  }
}

class Err<E extends Error> {
  private value: E;

  constructor(value: E) {
    this.value = value;
  }

  isOk(): boolean {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  unwrapErr(): E {
    return this.value;
  }

  /**
   * Used mostly with tests
   */
  unwrapOrThrow(): never {
    throw this.value;
  }

  /**
   * Used mostly with tests
   */
  unwrapErrOrThrow(): E {
    return this.value;
  }
}
