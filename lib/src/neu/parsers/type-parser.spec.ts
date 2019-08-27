import {
  createExistingSourceFile,
  EXAMPLES_DIR
} from "../../spec-helpers/helper";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseType } from "./type-parser";

describe("type parser", () => {
  const exampleFile = createExistingSourceFile(
    `${__dirname}/__spec-examples__/types.ts`
  );

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses null", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("null").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.NULL
    });
  });

  test("parses boolean", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("boolean").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.BOOLEAN
    });
  });

  test("parses true", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("true").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.BOOLEAN_LITERAL,
      value: true
    });
  });

  test("parses false", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("false").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.BOOLEAN_LITERAL,
      value: false
    });
  });

  test("parses string", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("string").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.STRING
    });
  });

  test("parses String", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("String").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.STRING
    });
  });

  test("parses literal string", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("literalString")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.STRING_LITERAL,
      value: "literalString"
    });
  });

  test("parses number", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("number").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.FLOAT
    });
  });

  test("parses Number", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Number").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.FLOAT
    });
  });

  test("parses Float", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Float").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.FLOAT
    });
  });

  test("parses Double", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Double").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.DOUBLE
    });
  });

  test("parses literal float", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("literalFloat")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.FLOAT_LITERAL,
      value: 1.02
    });
  });

  test("parses Integer", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Integer").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.INT32
    });
  });

  test("parses Int32", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Int32").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.INT32
    });
  });

  test("parses Int64", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Int64").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.INT64
    });
  });

  test("parses literal integer", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("literalInteger")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.INT_LITERAL,
      value: 2
    });
  });

  test("parses Date", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("Date").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.DATE
    });
  });

  test("parses DateTime", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("DateTime").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.DATE_TIME
    });
  });

  test("parses literal object", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("literalObject")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
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
    });
  });

  test("parses arrays", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("array").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.ARRAY,
      elementType: {
        kind: TypeKind.BOOLEAN
      }
    });
  });

  test("parses unions", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("union").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
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
    });
  });

  test("parses type aliases", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("alias").getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.REFERENCE,
      name: "Alias"
    });
    expect(typeTable.size).toBe(1);
    expect(typeTable.getOrError("Alias")).toStrictEqual({
      kind: TypeKind.STRING
    });
  });

  test("parses interfaces", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("interface")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.REFERENCE,
      name: "Interface"
    });
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
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("interfaceExtends")
      .getTypeNodeOrThrow();

    expect(parseType(type, typeTable, lociTable)).toStrictEqual({
      kind: TypeKind.REFERENCE,
      name: "InterfaceExtends"
    });
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

  test("fails to parse enums", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("enum").getTypeNodeOrThrow();

    expect(() => parseType(type, typeTable, lociTable)).toThrowError(
      "enums are not supported (offending type: Enum)"
    );
  });

  test("fails to parse enum constants", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("enumConstant")
      .getTypeNodeOrThrow();

    expect(() => parseType(type, typeTable, lociTable)).toThrowError(
      "enums are not supported (offending type: Enum)"
    );
  });

  test("fails to parse Maps", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace.getPropertyOrThrow("map").getTypeNodeOrThrow();

    expect(() => parseType(type, typeTable, lociTable)).toThrowError(
      "Map is not supported"
    );
  });

  test("fails to parse object with index signatures", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("indexSignature")
      .getTypeNodeOrThrow();

    expect(() => parseType(type, typeTable, lociTable)).toThrowError(
      "indexed types are not supported"
    );
  });

  test("fails to parse interface with index signatures", () => {
    const interphace = exampleFile.getInterfaceOrThrow("TypeInterface");
    const type = interphace
      .getPropertyOrThrow("interfaceWithIndexSignature")
      .getTypeNodeOrThrow();

    expect(() => parseType(type, typeTable, lociTable)).toThrowError(
      "indexed types are not supported"
    );
  });
});
