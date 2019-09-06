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
