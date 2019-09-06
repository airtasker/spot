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

// tryCatch(() => unsafeHead(as), e => (e instanceof Error ? e : new Error('unknown error')

// interface BaseResult<T, E> {
//   isOk(): this is Ok<T, E>;
//   isErr(): this is Err<T, E>;
//   map<U>(fn: (val: T) => U): Result<U, E>;
//   mapErr<U>(fn: (err: E) => U): Result<T, U>;
//   and<U>(res: Result<U, E>): Result<U, E>;
//   andThen<U>(op: (val: T) => Result<U, E>): Result<U, E>;
//   or(res: Result<T, E>): Result<T, E>;
//   orElse<U>(op: (err: E) => Result<T, U>): Result<T, U>;
//   unwrap(): T | never;
//   unwrapOr(optb: T): T;
//   unwrapOrElse(op: (err: E) => T): T;
// }

// export type Result<T, E> = Ok<T, E> | Err<T, E>;

// class Ok<T, E> implements BaseResult<T, E> {
//   constructor(private value: T) {}

//   map<U>(fn: (a: T) => U) {
//     return new Ok<U, E>(fn(this.value));
//   }

//   mapErr<U>(fn: (a: E) => U) {
//     return (this as unknown) as Ok<T, U>;
//   }

//   isOk(): this is Ok<T, E> {
//     return true;
//   }

//   isErr(): this is Err<T, E> {
//     return false;
//   }

//   and<U>(res: Result<U, E>) {
//     return res;
//   }

//   andThen<U>(op: (val: T) => Result<U, E>) {
//     return op(this.value);
//   }

//   or(res: Result<T, E>) {
//     return this;
//   }

//   orElse<U>(op: (err: E) => Result<T, U>) {
//     return (this as unknown) as Ok<T, U>;
//   }

//   unwrapOr(optb: T) {
//     return this.value;
//   }

//   unwrapOrElse(op: (err: E) => T) {
//     return this.value;
//   }

//   unwrap(): T {
//     return this.value;
//   }
// }

// class Err<T, E> implements BaseResult<T, E> {
//   constructor(private error: E) {}

//   map<U>(fn: (a: T) => U) {
//     return (this as unknown) as Err<U, E>;
//   }

//   mapErr<U>(fn: (a: E) => U) {
//     return new Err<T, U>(fn(this.error));
//   }

//   isOk(): this is Ok<T, E> {
//     return false;
//   }

//   isErr(): this is Err<T, E> {
//     return false;
//   }

//   and<U>(res: Result<U, E>) {
//     return (this as unknown) as Err<U, E>;
//   }

//   andThen<U>(op: (val: T) => Result<U, E>) {
//     return (this as unknown) as Err<U, E>;
//   }

//   or(res: Result<T, E>) {
//     return res;
//   }

//   orElse<U>(op: (err: E) => Result<T, U>) {
//     return op(this.error);
//   }

//   unwrapOr(optb: T) {
//     return optb;
//   }

//   unwrapOrElse(op: (err: E) => T) {
//     return op(this.error);
//   }

//   unwrap(): never {
//     throw this.error;
//   }
// }

// export function ok<T, E>(value: T extends Error ? never : T): Ok<T, E> {
//   return new Ok(value);
// }

// export function err<T, E extends Error>(error: E): Err<T, E> {
//   return new Err(error);
// }
