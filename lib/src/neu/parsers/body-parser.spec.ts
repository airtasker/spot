import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseBody } from "./body-parser";

describe("body parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/body.ts`
  ).file;
  const method = exampleFile
    .getClassOrThrow("BodyClass")
    .getMethodOrThrow("bodyMethod");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @body decorated parameter", () => {
    const result = parseBody(
      method.getParameterOrThrow("body"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("fails to parse optional @body decorated parameter", () => {
    expect(
      parseBody(
        method.getParameterOrThrow("optionalBody"),
        typeTable,
        lociTable
      ).unwrapErrOrThrow()
    ).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse non-@body decorated parameter", () => {
    expect(() =>
      parseBody(method.getParameterOrThrow("notBody"), typeTable, lociTable)
    ).toThrowError("Expected to find decorator named 'body'");
  });
});
