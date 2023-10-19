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
    expect(result).toHaveLength(5);
    expect(result[0]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "property",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      },
      optional: false
    });
    expect(result[1]).toStrictEqual({
      description: "property description",
      examples: undefined,
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      },
      optional: false
    });
    expect(result[2]).toStrictEqual({
      description: "property-example description",
      examples: [{ name: "property-example", value: "property-example-value" }],
      name: "property-with-example",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      },
      optional: false
    });
    expect(result[3]).toStrictEqual({
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
        schemaProps: undefined
      },
      optional: false
    });
    expect(result[4]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "optionalProperty",
      type: {
        kind: TypeKind.INT64,
        schemaProps: undefined
      },
      optional: true
    });
  });

  test("parses @headers as interface parameter", () => {
    const result = parseHeaders(
      method.getParameterOrThrow("interfaceHeaders"),
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
      },
      optional: false
    });
  });

  test("parses @headers as type alias type literal parameter", () => {
    const result = parseHeaders(
      method.getParameterOrThrow("typeAliasTypeLiteralHeaders"),
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
      },
      optional: false
    });
  });

  test("parses @headers as type alias interface parameters", () => {
    const result = parseHeaders(
      method.getParameterOrThrow("typeAliasTypeReferenceHeaders"),
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
    ).toThrow(
      "expected parameter value to be an type literal or interface object"
    );
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
    ).toThrow("Expected to find decorator named 'headers'");
  });
});
