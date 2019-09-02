import { createExistingSourceFile } from "../../spec-helpers/helper";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseSecurityHeader } from "./security-header-parser";

describe("security header parser", () => {
  const exampleFile = createExistingSourceFile(
    `${__dirname}/__spec-examples__/security-header.ts`
  );

  const klass = exampleFile.getClassOrThrow("SecurityHeaderClass");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @securityHeader decorated property", () => {
    const result = parseSecurityHeader(
      klass.getPropertyOrThrow(`\"security-header\"`),
      typeTable,
      lociTable
    );

    expect(result).toStrictEqual({
      description: "security header description",
      name: "security-header",
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("fails to parse optional @securityHeader decorated property", () => {
    expect(() =>
      parseSecurityHeader(
        klass.getPropertyOrThrow(`\"optional-security-header\"`),
        typeTable,
        lociTable
      )
    ).toThrowError("@securityHeader property cannot be optional");
  });

  test("fails to parse non-@securityHeader decorated property", () => {
    expect(() =>
      parseSecurityHeader(
        klass.getPropertyOrThrow(`\"not-security-header\"`),
        typeTable,
        lociTable
      )
    ).toThrowError("Expected to find decorator named 'securityHeader'");
  });
});
