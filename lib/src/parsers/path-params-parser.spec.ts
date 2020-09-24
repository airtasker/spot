import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parsePathParams } from "./path-params-parser";

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
    expect(result).toHaveLength(3);
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
  });

  test("parses @pathParams as interface parameter", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("interfacePathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("parses @pathParams as type alias type literal parameter", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("typeAliasTypeLiteralPathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("parses @pathParams as type alias interface parameters", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("typeAliasTypeReferencePathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
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
    ).toThrowError(
      "expected parameter value to be an type literal or interface object"
    );
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
});
