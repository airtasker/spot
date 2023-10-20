import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseQueryParams } from "./query-params-parser";

describe("query params parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/query-params.ts`
  ).file;
  const method = exampleFile
    .getClassOrThrow("QueryParamsClass")
    .getMethodOrThrow("queryParamsMethod");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @queryParams decorated object parameter", () => {
    const result = parseQueryParams(
      method.getParameterOrThrow("queryParams"),
      typeTable,
      lociTable
    ).unwrapOrThrow();
    expect(result).toHaveLength(8);
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
        kind: TypeKind.STRING,
        schemaProps: undefined
      },
      optional: true
    });
    expect(result[5]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "objectProperty",
      type: {
        kind: TypeKind.OBJECT,
        schemaProps: undefined,
        properties: [
          {
            description: undefined,
            name: "objectProp",
            optional: false,
            type: {
              kind: TypeKind.STRING,
              schemaProps: undefined
            }
          }
        ]
      },
      optional: false
    });
    expect(result[6]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "arrayProperty",
      type: {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.STRING
        },
        schemaProps: undefined
      },
      optional: false
    });
    expect(result[7]).toStrictEqual({
      description: undefined,
      examples: undefined,
      name: "property.with.dots",
      type: {
        kind: TypeKind.STRING,
        schemaProps: undefined
      },
      optional: false
    });
  });

  test("parses @queryParams as interface parameter", () => {
    const result = parseQueryParams(
      method.getParameterOrThrow("interfaceQueryParams"),
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

  test("parses @queryParams as type alias type literal parameter", () => {
    const result = parseQueryParams(
      method.getParameterOrThrow("typeAliasTypeLiteralQueryParams"),
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

  test("parses @queryParams as type alias interface parameter", () => {
    const result = parseQueryParams(
      method.getParameterOrThrow("typeAliasTypeReferenceQueryParams"),
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

  test("fails to parse @queryParams decorated non-object parameter", () => {
    expect(() =>
      parseQueryParams(
        method.getParameterOrThrow("nonObjectQueryParams"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toThrow(
      "expected parameter value to be an type literal or interface object"
    );
  });

  test("fails to parse optional @queryParams decorated parameter", () => {
    expect(
      parseQueryParams(
        method.getParameterOrThrow("optionalQueryParams"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse @queryParams with param name containing illegal characters", () => {
    const err = parseQueryParams(
      method.getParameterOrThrow("queryParamsWithIllegalPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @queryParams with empty param name", () => {
    const err = parseQueryParams(
      method.getParameterOrThrow("queryParamsWithEmptyPropertyName"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @queryParams with an illegal param type", () => {
    const err = parseQueryParams(
      method.getParameterOrThrow("queryParamsWithIllegalPropertyType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @queryParams with an illegal array param type", () => {
    const err = parseQueryParams(
      method.getParameterOrThrow("queryParamsWithIllegalPropertyArrayType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @queryParams with an illegal object param type", () => {
    const err = parseQueryParams(
      method.getParameterOrThrow("queryParamsWithIllegalPropertyObjectType"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse non-@queryParams decorated parameter", () => {
    expect(() =>
      parseQueryParams(
        method.getParameterOrThrow("notQueryParams"),
        typeTable,
        lociTable
      )
    ).toThrow("Expected to find decorator named 'queryParams'");
  });
});
