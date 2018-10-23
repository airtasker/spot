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
import { jsonSchema } from "./json-schema";

describe("JSON Schema generator", () => {
  describe("generates type validator", () => {
    test("void", () => {
      expect(jsonSchema(VOID)).toMatchInlineSnapshot(`null`);
    });

    test("null", () => {
      expect(jsonSchema(NULL)).toMatchInlineSnapshot(`
Object {
  "type": "null",
}
`);
    });

    test("boolean", () => {
      expect(jsonSchema(BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean constant", () => {
      expect(jsonSchema(booleanConstant(true))).toMatchInlineSnapshot(`
Object {
  "const": true,
  "type": "boolean",
}
`);
      expect(jsonSchema(booleanConstant(false))).toMatchInlineSnapshot(`
Object {
  "const": false,
  "type": "boolean",
}
`);
    });

    test("string", () => {
      expect(jsonSchema(STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string constant", () => {
      expect(jsonSchema(stringConstant("some constant")))
        .toMatchInlineSnapshot(`
Object {
  "const": "some constant",
  "type": "string",
}
`);
    });

    test("number", () => {
      expect(jsonSchema(NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("integer constant", () => {
      expect(jsonSchema(integerConstant(0))).toMatchInlineSnapshot(`
Object {
  "const": 0,
  "type": "integer",
}
`);
      expect(jsonSchema(integerConstant(123))).toMatchInlineSnapshot(`
Object {
  "const": 123,
  "type": "integer",
}
`);
      expect(jsonSchema(integerConstant(-1000))).toMatchInlineSnapshot(`
Object {
  "const": -1000,
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(jsonSchema(objectType({}))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        jsonSchema(
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
        jsonSchema(
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
      expect(jsonSchema(arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("optional", () => {
      expect(() => jsonSchema(optionalType(STRING))).toThrowError(
        "Unsupported top-level optional type"
      );
    });

    test("union", () => {
      expect(jsonSchema(unionType(STRING, NUMBER, BOOLEAN)))
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
      expect(jsonSchema(typeReference("OtherType"))).toMatchInlineSnapshot(`
Object {
  "$ref": "OtherType",
}
`);
    });
  });
});
