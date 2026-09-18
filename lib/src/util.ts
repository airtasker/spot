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

  /**
   * `this is never` rather than `boolean`, because the return type is what makes
   * `Result` narrow. A caller writes `if (r.isErr()) return r;` and then reaches for
   * `r.unwrap()`; narrowing a union by a method call needs every member of that union
   * to answer with a type predicate. When one member answers `boolean` the call
   * carries no type information, so `r` stays `Ok<T> | Err<E>` in both branches: the
   * early return stops being assignable to the caller's `Result`, and `unwrap` stops
   * being visible. An `Ok` is never an error, so the narrowed type here is `never`.
   */
  isErr(): this is never {
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

  // A type predicate for the same reason as `Ok.isErr` above. An `Err` is never ok.
  isOk(): this is never {
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
