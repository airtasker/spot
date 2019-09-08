import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { OptionalNotAllowedError, TypeNotAllowedError } from "../errors";
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
    expect(result).toHaveLength(3);
    expect(result[0]).toStrictEqual({
      description: undefined,
      name: "optionalProperty",
      type: {
        kind: TypeKind.STRING
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
