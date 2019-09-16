import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
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
    expect(result).toHaveLength(5);
    expect(result[0]).toStrictEqual({
      description: undefined,
      name: "arrayProperty",
      type: {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.STRING
        }
      },
      optional: false
    });
    expect(result[1]).toStrictEqual({
      description: undefined,
      name: "objectProperty",
      type: {
        kind: TypeKind.OBJECT,
        properties: [
          {
            description: undefined,
            name: "objectProp",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          }
        ]
      },
      optional: false
    });
    expect(result[2]).toStrictEqual({
      description: undefined,
      name: "optionalProperty",
      type: {
        kind: TypeKind.STRING
      },
      optional: true
    });
    expect(result[3]).toStrictEqual({
      description: undefined,
      name: "property",
      type: {
        kind: TypeKind.STRING
      },
      optional: false
    });
    expect(result[4]).toStrictEqual({
      description: "property description",
      name: "property-with-description",
      type: {
        kind: TypeKind.STRING
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
    ).toThrowError("expected parameter value to be an type literal object");
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
    ).toThrowError("Expected to find decorator named 'queryParams'");
  });
});
