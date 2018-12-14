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
import {
  openApi3TypeSchema,
  openApiV3ContentTypeSchema
} from "./openapi3-schema";

describe("JSON Schema generator", () => {
  describe("generates content type validator", () => {
    test("application/json", () => {
      expect(
        openApiV3ContentTypeSchema(
          {},
          "application/json",
          typeReference("OtherType")
        )
      ).toMatchInlineSnapshot(`
Object {
  "content": Object {
    "application/json": Object {
      "schema": Object {
        "$ref": "#/components/schemas/OtherType",
      },
    },
  },
}
`);
    });

    test("text/html", () => {
      expect(
        openApiV3ContentTypeSchema({}, "text/html", typeReference("OtherType"))
      ).toMatchInlineSnapshot(`
Object {
  "content": Object {
    "text/html": Object {
      "schema": Object {
        "type": "string",
      },
    },
  },
}
`);
    });
  });

  describe("generates type validator", () => {
    test("void", () => {
      expect(openApi3TypeSchema({}, VOID)).toMatchInlineSnapshot(`null`);
    });

    test("null", () => {
      expect(openApi3TypeSchema({}, NULL)).toMatchInlineSnapshot(`
Object {
  "nullable": true,
}
`);
    });

    test("boolean", () => {
      expect(openApi3TypeSchema({}, BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean constant", () => {
      expect(openApi3TypeSchema({}, booleanConstant(true)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    true,
  ],
  "type": "boolean",
}
`);
      expect(openApi3TypeSchema({}, booleanConstant(false)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    false,
  ],
  "type": "boolean",
}
`);
    });

    test("string", () => {
      expect(openApi3TypeSchema({}, STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string constant", () => {
      expect(openApi3TypeSchema({}, stringConstant("some constant")))
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
      expect(openApi3TypeSchema({}, NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("int32", () => {
      expect(openApi3TypeSchema({}, INT32)).toMatchInlineSnapshot(`
Object {
  "format": "int32",
  "type": "integer",
}
`);
    });

    test("int64", () => {
      expect(openApi3TypeSchema({}, INT64)).toMatchInlineSnapshot(`
Object {
  "format": "int64",
  "type": "integer",
}
`);
    });

    test("float", () => {
      expect(openApi3TypeSchema({}, FLOAT)).toMatchInlineSnapshot(`
Object {
  "format": "float",
  "type": "number",
}
`);
    });

    test("double", () => {
      expect(openApi3TypeSchema({}, DOUBLE)).toMatchInlineSnapshot(`
Object {
  "format": "double",
  "type": "number",
}
`);
    });

    test("integer constant", () => {
      expect(openApi3TypeSchema({}, integerConstant(0))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    0,
  ],
  "type": "integer",
}
`);
      expect(openApi3TypeSchema({}, integerConstant(123)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    123,
  ],
  "type": "integer",
}
`);
      expect(openApi3TypeSchema({}, integerConstant(-1000)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    -1000,
  ],
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(openApi3TypeSchema({}, objectType({}))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        openApi3TypeSchema(
          {},
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
        openApi3TypeSchema(
          {},
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
      expect(openApi3TypeSchema({}, arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("optional", () => {
      expect(() => openApi3TypeSchema({}, optionalType(STRING))).toThrowError(
        "Unsupported top-level optional type"
      );
    });

    test("union", () => {
      expect(openApi3TypeSchema({}, unionType(STRING, NUMBER, BOOLEAN)))
        .toMatchInlineSnapshot(`
Object {
  "oneOf": Array [
    Object {
      "type": "string",
    },
    Object {
      "type": "number",
    },
    Object {
      "type": "boolean",
    },
  ],
}
`);
    });

    test("type reference", () => {
      expect(openApi3TypeSchema({}, typeReference("OtherType")))
        .toMatchInlineSnapshot(`
Object {
  "$ref": "#/components/schemas/OtherType",
}
`);
    });
  });
});
