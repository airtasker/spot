import {
  arrayType,
  BOOLEAN,
  booleanConstant,
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
import { openApi3Schema } from "./openapi-3-schema";

describe("JSON Schema generator", () => {
  describe("generates type validator", () => {
    test("void", () => {
      expect(openApi3Schema(VOID)).toMatchInlineSnapshot(`null`);
    });

    test("null", () => {
      expect(openApi3Schema(NULL)).toMatchInlineSnapshot(`
Object {
  "nullable": true,
}
`);
    });

    test("boolean", () => {
      expect(openApi3Schema(BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean constant", () => {
      expect(openApi3Schema(booleanConstant(true))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    true,
  ],
  "type": "boolean",
}
`);
      expect(openApi3Schema(booleanConstant(false))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    false,
  ],
  "type": "boolean",
}
`);
    });

    test("string", () => {
      expect(openApi3Schema(STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string constant", () => {
      expect(openApi3Schema(stringConstant("some constant")))
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
      expect(openApi3Schema(NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("integer constant", () => {
      expect(openApi3Schema(integerConstant(0))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    0,
  ],
  "type": "integer",
}
`);
      expect(openApi3Schema(integerConstant(123))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    123,
  ],
  "type": "integer",
}
`);
      expect(openApi3Schema(integerConstant(-1000))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    -1000,
  ],
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(openApi3Schema(objectType({}))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        openApi3Schema(
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
        openApi3Schema(
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
      expect(openApi3Schema(arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("optional", () => {
      expect(() => openApi3Schema(optionalType(STRING))).toThrowError(
        "Unsupported top-level optional type"
      );
    });

    test("union", () => {
      expect(openApi3Schema(unionType(STRING, NUMBER, BOOLEAN)))
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
      expect(openApi3Schema(typeReference("OtherType"))).toMatchInlineSnapshot(`
Object {
  "$ref": "#/components/schemas/OtherType",
}
`);
    });
  });
});
