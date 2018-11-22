import {
  arrayType,
  BOOLEAN,
  booleanConstant,
  DOUBLE,
  FLOAT,
  INT32,
  INT64,
  integerConstant,
  NULL,
  NUMBER,
  objectType,
  optionalType,
  STRING,
  stringConstant,
  typeReference,
  unionType,
  VOID
} from "../../models";
import { openApi2TypeSchema } from "./openapi2-schema";
import { jsonTypeSchema } from "./json-schema";

describe("JSON Schema generator", () => {
  describe("generates type validator", () => {
    test("void", () => {
      expect(openApi2TypeSchema(VOID)).toMatchInlineSnapshot(`null`);
    });

    test("null", () => {
      expect(openApi2TypeSchema(NULL)).toMatchInlineSnapshot(`null`);
    });

    test("boolean", () => {
      expect(openApi2TypeSchema(BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean constant", () => {
      expect(openApi2TypeSchema(booleanConstant(true))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    true,
  ],
  "type": "boolean",
}
`);
      expect(openApi2TypeSchema(booleanConstant(false))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    false,
  ],
  "type": "boolean",
}
`);
    });

    test("string", () => {
      expect(openApi2TypeSchema(STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string constant", () => {
      expect(openApi2TypeSchema(stringConstant("some constant")))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    "some constant",
  ],
  "type": "string",
}
`);
    });

    test("number", () => {
      expect(openApi2TypeSchema(NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("int32", () => {
      expect(openApi2TypeSchema(INT32)).toMatchInlineSnapshot(`
Object {
  "format": "int32",
  "type": "integer",
}
`);
    });

    test("int64", () => {
      expect(openApi2TypeSchema(INT64)).toMatchInlineSnapshot(`
Object {
  "format": "int64",
  "type": "integer",
}
`);
    });

    test("float", () => {
      expect(openApi2TypeSchema(FLOAT)).toMatchInlineSnapshot(`
Object {
  "format": "float",
  "type": "number",
}
`);
    });

    test("double", () => {
      expect(openApi2TypeSchema(DOUBLE)).toMatchInlineSnapshot(`
Object {
  "format": "double",
  "type": "number",
}
`);
    });

    test("integer constant", () => {
      expect(openApi2TypeSchema(integerConstant(0))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    0,
  ],
  "type": "integer",
}
`);
      expect(openApi2TypeSchema(integerConstant(122))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    122,
  ],
  "type": "integer",
}
`);
      expect(openApi2TypeSchema(integerConstant(-1000))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    -1000,
  ],
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(openApi2TypeSchema(objectType({}))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        openApi2TypeSchema(
          objectType({
            singleField: NUMBER
          })
        )
      ).toMatchInlineSnapshot(`
Object {
  "properties": Object {
    "singleField": Object {
      "type": "number",
    },
  },
  "required": Array [
    "singleField",
  ],
  "type": "object",
}
`);
      expect(
        openApi2TypeSchema(
          objectType({
            field1: NUMBER,
            field2: STRING,
            field3: optionalType(BOOLEAN)
          })
        )
      ).toMatchInlineSnapshot(`
Object {
  "properties": Object {
    "field1": Object {
      "type": "number",
    },
    "field2": Object {
      "type": "string",
    },
    "field3": Object {
      "type": "boolean",
    },
  },
  "required": Array [
    "field1",
    "field2",
  ],
  "type": "object",
}
`);
    });

    test("array", () => {
      expect(openApi2TypeSchema(arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("optional", () => {
      expect(() => openApi2TypeSchema(optionalType(STRING))).toThrowError(
        "Unsupported top-level optional type"
      );
    });

    test("union", () => {
      expect(() =>
        openApi2TypeSchema(unionType(STRING, NUMBER, BOOLEAN))
      ).toThrowError("Unions are not supported in OpenAPI 2");
    });

    test("type reference", () => {
      expect(openApi2TypeSchema(typeReference("OtherType")))
        .toMatchInlineSnapshot(`
Object {
  "$ref": "#/definitions/OtherType",
}
`);
    });
  });
});
