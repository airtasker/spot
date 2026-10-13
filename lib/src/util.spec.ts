import { err, ok, Result } from "./util";

describe("Result", () => {
  /**
   * `Ok.isErr` and `Err.isOk` both return `this is never` rather than `boolean`,
   * and that is what lets a `Result` narrow through a method call — the shape
   * every parser in `lib/src/parsers` is written in. Narrowing a union by a
   * method call needs *every* member of the union to answer with a type
   * predicate; one member answering `boolean` costs the call its type
   * information, leaving the value un-narrowed in both branches.
   *
   * What is under test is the narrowing, so the failure is a compile error
   * rather than a failed expectation: widen either return type back to
   * `boolean` and this file stops type-checking, which ts-jest reports as a
   * failing suite. The two helpers below narrow through different methods, so
   * each pins one method and neither covers the other.
   */
  const narrowViaIsErr = (r: Result<number, Error>): Result<string, Error> => {
    // Needs `r` to narrow to `Err`, or an `Err<Error>` is not assignable to a
    // `Result<string, Error>`. Pins `Ok.isErr`.
    if (r.isErr()) return r;
    return ok(String(r.unwrap()));
  };

  const narrowViaIsOk = (r: Result<number, Error>): string => {
    if (r.isOk()) return String(r.unwrap());
    // Needs `r` to narrow to `Err`, or `unwrapErr` is not a property of the
    // union. Pins `Err.isOk`.
    return r.unwrapErr().message;
  };

  it("narrows to Ok when the value is present", () => {
    expect(narrowViaIsErr(ok(7)).unwrapOrThrow()).toBe("7");
    expect(narrowViaIsOk(ok(7))).toBe("7");
  });

  it("narrows to Err when the error is present", () => {
    const failure: Result<number, Error> = err(new Error("no value"));
    expect(narrowViaIsErr(failure).unwrapErrOrThrow().message).toBe("no value");
    expect(narrowViaIsOk(failure)).toBe("no value");
  });
});
