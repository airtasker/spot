import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseSecurityHeader } from "./security-header-parser";

describe("security header parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/security-header.ts`
  ).file;

  const klass = exampleFile.getClassOrThrow("SecurityHeaderClass");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @securityHeader decorated property", () => {
    const result = parseSecurityHeader(
      klass.getPropertyOrThrow(`"security-header"`),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      description: "security header description",
      name: "security-header",
      type: {
        kind: TypeKind.STRING
      }
    });
  });

  test("fails to parse optional @securityHeader decorated property", () => {
    const err = parseSecurityHeader(
      klass.getPropertyOrThrow(`"optional-security-header"`),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(OptionalNotAllowedError);
  });

  test("fails to parse non-@securityHeader decorated property", () => {
    expect(() =>
      parseSecurityHeader(
        klass.getPropertyOrThrow(`"not-security-header"`),
        typeTable,
        lociTable
      )
    ).toThrow("Expected to find decorator named 'securityHeader'");
  });

  test("fails to parse @securityHeader decorated property with a field name containing illegal characters", () => {
    const err = parseSecurityHeader(
      klass.getPropertyOrThrow(`"illegal-field-name-security-header%$"`),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @securityHeader decorated property with an empty field name", () => {
    const err = parseSecurityHeader(
      klass.getPropertyOrThrow(`""`),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse @securityHeader decorated property with a non-string type", () => {
    const err = parseSecurityHeader(
      klass.getPropertyOrThrow(`"not-string-security-header"`),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });
});
