import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseResponse } from "./response-parser";

describe("response parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/response.ts`
  ).file;
  const klass = exampleFile.getClassOrThrow("ResponseClass");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @response decorated method", () => {
    const result = parseResponse(
      klass.getMethodOrThrow("response"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: {
        type: { kind: TypeKind.STRING }
      },
      description: "response description",
      headers: [
        {
          description: undefined,
          examples: undefined,
          name: "property",
          optional: false,
          type: { kind: TypeKind.STRING, schemaProps: undefined }
        }
      ],
      status: 200
    });
  });

  test("parses parameterless @response decorated method", () => {
    const result = parseResponse(
      klass.getMethodOrThrow("parameterlessResponse"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: undefined,
      description: undefined,
      headers: [],
      status: 200
    });
  });

  test("fails to parse non-@response decorated method", () => {
    expect(() =>
      parseResponse(klass.getMethodOrThrow("notResponse"), typeTable, lociTable)
    ).toThrow("Expected to find decorator named 'response'");
  });
});
