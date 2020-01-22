import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseHeaders } from "./headers-parser";

describe("headers parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/headers.ts`
  ).file;
  const method = exampleFile
    .getClassOrThrow("HeadersClass")
    .getMethodOrThrow("headersMethod");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @headers decorated object parameter", () => {
    const result = parseHeaders(
      method.getParameterOrThrow("headers"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(3);
    expect(result[0]).toStrictEqual({
      description: undefined,
      name: "optionalProperty",
      type: {
        kind: TypeKind.INT64
      },
      optional: true
    });
    expect(result[1]).toStrictEqual({
      description: undefined,
      name: "property",
      type: {
        kind: TypeKind.STRING
      },
      optional: false
    });
    expect(result[2]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
      },
      optional: false
    });
  });

  test("fails to parse @headers decorated non-object parameter", () => {
    expect(() =>
      parseHeaders(
        method.getParameterOrThrow("nonObjectHeaders"),
        typeTable,
        lociTable
      )
    ).toThrowError("expected parameter value to be an type literal object");
  });

  test("fails to parse optional @headers decorated parameter", () => {
    expect(
      parseHeaders(
        method.getParameterOrThrow("optionalHeaders"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse @headers with param containing illegal characters", () => {
    const err = parseHeaders(
      method.getParameterOrThrow("headersWithIllegalPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @headers with an empty param name", () => {
    const err = parseHeaders(
      method.getParameterOrThrow("headersWithEmptyPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @headers with an illegal param type", () => {
    const err = parseHeaders(
      method.getParameterOrThrow("headersWithIllegalType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse non-@headers decorated parameter", () => {
    expect(() =>
      parseHeaders(
        method.getParameterOrThrow("notHeaders"),
        typeTable,
        lociTable
      )
    ).toThrowError("Expected to find decorator named 'headers'");
  });
});
