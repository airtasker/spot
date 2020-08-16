import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parsePathParams } from "./path-params-parser";
import { Type } from "ts-morph";

describe("path params parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/path-params.ts`
  ).file;
  const method = exampleFile
    .getClassOrThrow("PathParamsClass")
    .getMethodOrThrow("pathParamsMethod");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @pathParams decorated object parameter", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("pathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(5);
    expect(result[0]).toStrictEqual({
      description: undefined,
      name: "arrayProperty",
      type: {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.STRING
        }
      }
    });
    expect(result[1]).toStrictEqual({
      description: undefined,
      name: "property",
      type: {
        kind: TypeKind.STRING
      }
    });
    expect(result[2]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
    expect(result[3]).toStrictEqual({
      description: "property-example description",
      examples: { "property-example": "property-example-value" },
      name: "property-with-example",
      type: {
        kind: TypeKind.STRING
      }
    });
    expect(result[4]).toStrictEqual({
      description: "property-two-examples description",
      examples: {
        "property-example-one": "property-example-one-value",
        "property-example-two": "property-example-two-value"
      },
      name: "property-with-examples",
      type: {
        kind: TypeKind.ARRAY
      }
    });
  });

  test("fails to parse @pathParams decorated non-object parameter", () => {
    expect(() =>
      parsePathParams(
        method.getParameterOrThrow("nonObjectPathParams"),
        typeTable,
        lociTable
      )
    ).toThrowError("expected parameter value to be an type literal object");
  });

  test("fails to parse @pathParams with optional param", () => {
    expect(
      parsePathParams(
        method.getParameterOrThrow("pathParamsWithOptionalProperty"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse @pathParams with param name containing illegal characters", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("pathParamsWithIllegalPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @pathParams with empty param name", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("pathParamsWithEmptyPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @pathParams with an illegal param type", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("pathParamsWithIllegalPropertyType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @pathParams illegal array param type", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("pathParamsWithIllegalPropertyArrayType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse optional @pathParams decorated parameter", () => {
    expect(
      parsePathParams(
        method.getParameterOrThrow("optionalPathParams"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse non-@pathParams decorated parameter", () => {
    expect(() =>
      parsePathParams(
        method.getParameterOrThrow("notPathParams"),
        typeTable,
        lociTable
      )
    ).toThrowError("Expected to find decorator named 'pathParams'");
  });

  test("fails to parse empty @example decorator", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithEmptyExample"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @example decorator with duplicate name", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithDuplicateExampleName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @example decorator without value", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithExampleWithoutValue"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });
});
