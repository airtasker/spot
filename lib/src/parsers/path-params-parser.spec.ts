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
    expect(result).toHaveLength(5);
    expect(result[0]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "property",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      }
    });
    expect(result[1]).toStrictEqual({
      description: "property description",
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      }
    });
    expect(result[2]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "arrayProperty",
      type: {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.STRING
        },
        schemaProps: undefined
      }
    });
    expect(result[3]).toStrictEqual({
      description: "property-example description",
      examples: [{ name: "property-example", value: "property-example-value" }],
      name: "property-with-example",
      type: {
        kind: TypeKind.STRING,
        schemaProps: [
          {
            name: "example",
            value: "property-example-schema"
          }
        ]
      }
    });
    expect(result[4]).toStrictEqual({
      description: "property-two-examples description",
      examples: [
        {
          name: "property-example-one",
          value: 123
        },
        {
          name: "property-example-two",
          value: 456
        }
      ],
      name: "property-with-examples",
      type: {
        kind: TypeKind.INT32,
        schemaProps: [
          {
            name: "default",
            value: 12
          }
        ]
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
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
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
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      }
    });
  });

  test("parses @pathParams as type alias intersection parameter", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("typeAliasIntersectionPathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      description: "property description",
      examples: undefined,
      name: "property-2-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
    expect(result[0]).toEqual({
      description: "property description",
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("parses @pathParams as type alias and literal intersection parameter", () => {
    const result = parsePathParams(
      method.getParameterOrThrow("typeAliasAndLiteralIntersectionPathParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      description: "property description",
      examples: undefined,
      name: "property-2-with-description",
      type: {
        kind: TypeKind.STRING
      }
    });
    expect(result[0]).toEqual({
      description: "property description",
      examples: undefined,
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
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
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
    ).toThrow(
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
    ).toThrow("Expected to find decorator named 'pathParams'");
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

  test("fails to parse @example decorator with a different example type for a string property", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithNonMatchingStringExampleType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @example decorator with a different example type for an Integer property", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithNonMatchingIntegerExampleType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @example decorator with unquoted example string", () => {
    const err = parsePathParams(
      method.getParameterOrThrow("paramsWithUnquotedStringExample"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });
});
