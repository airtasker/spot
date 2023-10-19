import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseDefaultResponse } from "./default-response-parser";

describe("default response parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/default-response.ts`
  ).file;
  const klass = exampleFile.getClassOrThrow("DefaultResponseClass");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @defaultResponse decorated method", () => {
    const result = parseDefaultResponse(
      klass.getMethodOrThrow("defaultResponse"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: {
        type: { kind: TypeKind.STRING }
      },
      description: "default response description",
      headers: [
        {
          description: undefined,
          examples: undefined,
          name: "property",
          optional: false,
          type: { kind: TypeKind.STRING, schemaProps: undefined }
        }
      ]
    });
  });

  test("parses parameterless @defaultResponse decorated method", () => {
    const result = parseDefaultResponse(
      klass.getMethodOrThrow("parameterlessDefaultResponse"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: undefined,
      description: undefined,
      headers: []
    });
  });

  test("fails to parse non-@defaultResponse decorated method", () => {
    expect(() =>
      parseDefaultResponse(
        klass.getMethodOrThrow("notDefaultResponse"),
        typeTable,
        lociTable
      )
    ).toThrow("Expected to find decorator named 'defaultResponse'");
  });
});
