import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { TypeNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseType } from "./type-parser";

describe("type parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/types.ts`
  ).file;
  const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses null", () => {
    const type = interphace.getPropertyOrThrow("null").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.NULL
      }
    );
  });

  test("parses boolean", () => {
    const type = interphace.getPropertyOrThrow("boolean").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.BOOLEAN
      }
    );
  });

  test("parses true", () => {
    const type = interphace.getPropertyOrThrow("true").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.BOOLEAN_LITERAL,
        value: true
      }
    );
  });

  test("parses false", () => {
    const type = interphace.getPropertyOrThrow("false").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.BOOLEAN_LITERAL,
        value: false
      }
    );
  });

  test("parses string", () => {
    const type = interphace.getPropertyOrThrow("string").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.STRING
      }
    );
  });

  test("parses String", () => {
    const type = interphace.getPropertyOrThrow("String").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.STRING
      }
    );
  });

  test("parses literal string", () => {
    const type = interphace
      .getPropertyOrThrow("literalString")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.STRING_LITERAL,
        value: "literalString"
      }
    );
  });

  test("parses number", () => {
    const type = interphace.getPropertyOrThrow("number").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.FLOAT
      }
    );
  });

  test("parses Number", () => {
    const type = interphace.getPropertyOrThrow("Number").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.FLOAT
      }
    );
  });

  test("parses Float", () => {
    const type = interphace.getPropertyOrThrow("Float").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.FLOAT
      }
    );
  });

  test("parses Double", () => {
    const type = interphace.getPropertyOrThrow("Double").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.DOUBLE
      }
    );
  });

  test("parses literal float", () => {
    const type = interphace
      .getPropertyOrThrow("literalFloat")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.FLOAT_LITERAL,
        value: 1.02
      }
    );
  });

  test("parses Integer", () => {
    const type = interphace.getPropertyOrThrow("Integer").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.INT32
      }
    );
  });

  test("parses Int32", () => {
    const type = interphace.getPropertyOrThrow("Int32").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.INT32
      }
    );
  });

  test("parses Int64", () => {
    const type = interphace.getPropertyOrThrow("Int64").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.INT64
      }
    );
  });

  test("parses literal integer", () => {
    const type = interphace
      .getPropertyOrThrow("literalInteger")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.INT_LITERAL,
        value: 2
      }
    );
  });

  test("parses Date", () => {
    const type = interphace.getPropertyOrThrow("Date").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.DATE
      }
    );
  });

  test("parses DateTime", () => {
    const type = interphace.getPropertyOrThrow("DateTime").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.DATE_TIME
      }
    );
  });

  test("parses literal object", () => {
    const type = interphace
      .getPropertyOrThrow("literalObject")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.OBJECT,
        properties: [
          {
            description: undefined,
            name: "propertyA",
            optional: false,
            type: {
              kind: TypeKind.STRING
            }
          },
          {
            description: undefined,
            name: "propertyB",
            optional: true,
            type: {
              kind: TypeKind.BOOLEAN
            }
          }
        ]
      }
    );
  });

  test("parses arrays", () => {
    const type = interphace.getPropertyOrThrow("array").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.BOOLEAN
        }
      }
    );
  });

  test("parses complex Array", () => {
    const type = interphace.getPropertyOrThrow("Array").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.ARRAY,
        elementType: {
          kind: TypeKind.OBJECT,
          properties: [
            {
              description: undefined,
              name: "a",
              optional: false,
              type: {
                kind: TypeKind.BOOLEAN
              }
            }
          ]
        }
      }
    );
  });

  test("parses unions", () => {
    const type = interphace.getPropertyOrThrow("union").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        discriminator: undefined,
        kind: TypeKind.UNION,
        types: [
          {
            kind: TypeKind.BOOLEAN
          },
          {
            kind: TypeKind.DATE
          },
          {
            kind: TypeKind.NULL
          }
        ]
      }
    );
  });

  test("parses discriminated unions", () => {
    const type = interphace
      .getPropertyOrThrow("unionDiscriminated")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        discriminator: "type",
        kind: TypeKind.UNION,
        types: [
          {
            kind: TypeKind.REFERENCE,
            name: "DiscriminatedUnionElementA"
          },
          {
            kind: TypeKind.REFERENCE,
            name: "DiscriminatedUnionElementB"
          }
        ]
      }
    );
  });

  test("parses nullable discriminated unions", () => {
    const type = interphace
      .getPropertyOrThrow("unionDiscriminatedNullable")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        discriminator: "type",
        kind: TypeKind.UNION,
        types: [
          {
            kind: TypeKind.REFERENCE,
            name: "DiscriminatedUnionElementA"
          },
          {
            kind: TypeKind.REFERENCE,
            name: "DiscriminatedUnionElementB"
          },
          {
            kind: TypeKind.NULL
          }
        ]
      }
    );
  });

  test("parses type aliases", () => {
    const type = interphace.getPropertyOrThrow("alias").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.REFERENCE,
        name: "AliasString"
      }
    );
    expect(typeTable.size).toBe(1);
    expect(typeTable.getOrError("AliasString")).toStrictEqual({
      kind: TypeKind.STRING
    });
  });

  test("parses interfaces", () => {
    const type = interphace
      .getPropertyOrThrow("interface")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.REFERENCE,
        name: "Interface"
      }
    );
    expect(typeTable.size).toBe(1);
    expect(typeTable.getOrError("Interface")).toStrictEqual({
      kind: TypeKind.OBJECT,
      properties: [
        {
          description: undefined,
          name: "interfaceProperty",
          optional: false,
          type: {
            kind: TypeKind.BOOLEAN
          }
        }
      ]
    });
  });

  test("parses interfaces extending other interfaces", () => {
    const type = interphace
      .getPropertyOrThrow("interfaceExtends")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable).unwrapOrThrow()).toStrictEqual(
      {
        kind: TypeKind.REFERENCE,
        name: "InterfaceExtends"
      }
    );
    expect(typeTable.size).toBe(1);
    expect(typeTable.getOrError("InterfaceExtends")).toStrictEqual({
      kind: TypeKind.OBJECT,
      properties: [
        {
          description: undefined,
          name: "interfaceExtendsProperty",
          optional: false,
          type: {
            kind: TypeKind.BOOLEAN
          }
        },
        {
          description: undefined,
          name: "interfaceProperty",
          optional: false,
          type: {
            kind: TypeKind.BOOLEAN
          }
        }
      ]
    });
  });

  test("parses indexed accessing", () => {
    const type = interphace
      .getPropertyOrThrow("indexedAccess")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapOrThrow()
    ).toStrictEqual({ kind: "boolean" });
  });

  test("parses nested indexed accessing", () => {
    const type = interphace
      .getPropertyOrThrow("indexedAccessNested")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapOrThrow()
    ).toStrictEqual({ kind: "boolean" });
  });

  test("parses indexed indexed accessing", () => {
    const type = interphace
      .getPropertyOrThrow("indexedIndexedAccess")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapOrThrow()
    ).toStrictEqual({ kind: "boolean" });
  });

  test("fails to parse inlined indexed accessing", () => {
    const type = interphace
      .getPropertyOrThrow("indexedAccessInline")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });

  test("fails to parse enums", () => {
    const type = interphace.getPropertyOrThrow("enum").getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });

  test("fails to parse enum constants", () => {
    const type = interphace
      .getPropertyOrThrow("enumConstant")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });

  test("fails to parse Maps", () => {
    const type = interphace.getPropertyOrThrow("map").getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });

  test("fails to parse object with index signatures", () => {
    const type = interphace
      .getPropertyOrThrow("indexSignature")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });

  test("fails to parse interface with index signatures", () => {
    const type = interphace
      .getPropertyOrThrow("interfaceWithIndexSignature")
      .getTypeNodeOrThrow();

    expect(
      parseType(type, typeTable, lociTable).unwrapErrOrThrow()
    ).toBeInstanceOf(TypeNotAllowedError);
  });
});
