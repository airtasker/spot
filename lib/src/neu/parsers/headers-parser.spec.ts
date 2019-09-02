import { createExistingSourceFile } from "../../spec-helpers/helper";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseHeaders } from "./headers-parser";

describe("headers parser", () => {
  const exampleFile = createExistingSourceFile(
    `${__dirname}/__spec-examples__/headers.ts`
  );
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
    );
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
    expect(() =>
      parseHeaders(
        method.getParameterOrThrow("optionalHeaders"),
        typeTable,
        lociTable
      )
    ).toThrowError("@headers parameter cannot be optional");
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
