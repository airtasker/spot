import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseRequest } from "./request-parser";

describe("request parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/request.ts`
  ).file;
  const klass = exampleFile.getClassOrThrow("RequestClass");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @request decorated method", () => {
    const result = parseRequest(
      klass.getMethodOrThrow("request"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: {
        type: { kind: TypeKind.STRING }
      },
      headers: [
        {
          description: undefined,
          examples: undefined,
          schemaProps: undefined,
          name: "property",
          optional: false,
          type: { kind: TypeKind.STRING }
        }
      ],
      pathParams: [
        {
          description: undefined,
          examples: undefined,
          schemaProps: undefined,
          name: "property",
          type: { kind: TypeKind.STRING }
        }
      ],
      queryParams: [
        {
          description: undefined,
          examples: undefined,
          schemaProps: undefined,
          name: "property",
          optional: false,
          type: { kind: TypeKind.STRING }
        }
      ]
    });
  });

  test("parses parameterless @request decorated method", () => {
    const result = parseRequest(
      klass.getMethodOrThrow("parameterlessRequest"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      body: undefined,
      headers: [],
      pathParams: [],
      queryParams: []
    });
  });

  test("fails to parse non-@request decorated method", () => {
    expect(() =>
      parseRequest(klass.getMethodOrThrow("notRequest"), typeTable, lociTable)
    ).toThrowError("Expected to find decorator named 'request'");
  });
});
