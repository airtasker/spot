import {
  arrayType,
  BOOLEAN,
  booleanLiteral,
  INTEGER,
  NULL,
  NUMBER,
  numberLiteral,
  objectType,
  referenceType,
  STRING,
  stringLiteral,
  TypeKind,
  unionType
} from "../../models/types";
import { openApi3TypeSchema } from "./openapi3-schema";

describe("OpenAPI 3 generator", () => {
  describe("generates type validator", () => {
    test("null", () => {
      expect(() => openApi3TypeSchema([], NULL)).toThrowError(
        "The null type is only supported within a union in OpenAPI 3."
      );
    });

    test("boolean", () => {
      expect(openApi3TypeSchema([], BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean literal", () => {
      expect(openApi3TypeSchema([], booleanLiteral(true)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    true,
  ],
  "type": "boolean",
}
`);
      expect(openApi3TypeSchema([], booleanLiteral(false)))
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
      expect(openApi3TypeSchema([], STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string literal", () => {
      expect(openApi3TypeSchema([], stringLiteral("some literal")))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    "some literal",
  ],
  "type": "string",
}
`);
    });

    test("number", () => {
      expect(openApi3TypeSchema([], NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("number literal", () => {
      expect(openApi3TypeSchema([], numberLiteral(1.5))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    1.5,
  ],
  "type": "number",
}
`);
      expect(openApi3TypeSchema([], numberLiteral(-23.1)))
        .toMatchInlineSnapshot(`
Object {
  "enum": Array [
    -23.1,
  ],
  "type": "number",
}
`);
    });

    test("integer", () => {
      expect(openApi3TypeSchema([], INTEGER)).toMatchInlineSnapshot(`
Object {
  "format": "int32",
  "type": "integer",
}
`);
    });

    test("integer literal", () => {
      expect(openApi3TypeSchema([], numberLiteral(0))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    0,
  ],
  "type": "integer",
}
`);
      expect(openApi3TypeSchema([], numberLiteral(123))).toMatchInlineSnapshot(`
Object {
  "enum": Array [
    123,
  ],
  "type": "integer",
}
`);
      expect(openApi3TypeSchema([], numberLiteral(-1000)))
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
      expect(openApi3TypeSchema([], objectType([]))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        openApi3TypeSchema(
          [],
          objectType([
            {
              name: "singleField",
              type: NUMBER,
              optional: false
            }
          ])
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
          [],
          objectType([
            {
              name: "field1",
              type: NUMBER,
              optional: false
            },
            {
              name: "field2",
              type: STRING,
              optional: false
            },
            {
              name: "field3",
              type: BOOLEAN,
              optional: true
            }
          ])
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
      expect(openApi3TypeSchema([], arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("union", () => {
      expect(openApi3TypeSchema([], unionType([STRING])))
        .toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
      expect(openApi3TypeSchema([], unionType([STRING, NULL])))
        .toMatchInlineSnapshot(`
Object {
  "nullable": true,
  "type": "string",
}
`);
      expect(openApi3TypeSchema([], unionType([STRING, NUMBER, NULL])))
        .toMatchInlineSnapshot(`
Object {
  "nullable": true,
  "oneOf": Array [
    Object {
      "type": "string",
    },
    Object {
      "type": "number",
    },
  ],
}
`);
      expect(openApi3TypeSchema([], unionType([STRING, NUMBER, BOOLEAN])))
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
      expect(
        openApi3TypeSchema(
          [
            {
              name: "Type1",
              type: objectType([
                {
                  name: "not-disc-because-optional",
                  optional: true,
                  type: {
                    kind: TypeKind.STRING_LITERAL,
                    value: "type-1"
                  }
                },
                {
                  name: "disc",
                  optional: false,
                  type: {
                    kind: TypeKind.STRING_LITERAL,
                    value: "type-1"
                  }
                }
              ])
            },
            {
              name: "Type2",
              type: objectType([
                {
                  name: "not-disc-because-optional",
                  optional: true,
                  type: {
                    kind: TypeKind.STRING_LITERAL,
                    value: "type-2"
                  }
                },
                {
                  name: "disc",
                  optional: false,
                  type: {
                    kind: TypeKind.STRING_LITERAL,
                    value: "type-2"
                  }
                }
              ])
            }
          ],
          unionType([
            referenceType("Type1", "", TypeKind.OBJECT),
            referenceType("Type2", "", TypeKind.OBJECT)
          ])
        )
      ).toMatchInlineSnapshot(`
Object {
  "discriminator": Object {
    "mapping": Object {
      "type-1": "#/components/schemas/Type1",
      "type-2": "#/components/schemas/Type2",
    },
    "propertyName": "disc",
  },
  "oneOf": Array [
    Object {
      "$ref": "#/components/schemas/Type1",
    },
    Object {
      "$ref": "#/components/schemas/Type2",
    },
  ],
}
`);
    });

    test("type reference", () => {
      expect(
        openApi3TypeSchema(
          [],
          referenceType("OtherType", "location", TypeKind.STRING)
        )
      ).toMatchInlineSnapshot(`
Object {
  "$ref": "#/components/schemas/OtherType",
}
`);
    });
  });
});
