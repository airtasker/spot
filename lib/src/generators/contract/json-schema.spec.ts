import { cleanse } from "../../cleansers/cleanser";
import path from "path";
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
import { parse } from "../../parsers/parser";
import { generateJsonSchema, jsonTypeSchema } from "./json-schema";

const EXAMPLE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "test",
  "examples",
  "contract.ts"
);

describe("JSON Schema generator", () => {
  test("produces valid code", async () => {
    const contractNode = parse(EXAMPLE_PATH, {
      baseUrl: ".",
      paths: {
        "@airtasker/spot": ["./lib/src/lib"]
      }
    });
    const contractDefinition = cleanse(contractNode);
    expect(generateJsonSchema(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateJsonSchema(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });

  describe("generates type validator", () => {
    test("null", () => {
      expect(jsonTypeSchema(NULL)).toMatchInlineSnapshot(`
Object {
  "type": "null",
}
`);
    });

    test("boolean", () => {
      expect(jsonTypeSchema(BOOLEAN)).toMatchInlineSnapshot(`
Object {
  "type": "boolean",
}
`);
    });

    test("boolean literal", () => {
      expect(jsonTypeSchema(booleanLiteral(true))).toMatchInlineSnapshot(`
Object {
  "const": true,
  "type": "boolean",
}
`);
      expect(jsonTypeSchema(booleanLiteral(false))).toMatchInlineSnapshot(`
Object {
  "const": false,
  "type": "boolean",
}
`);
    });

    test("string", () => {
      expect(jsonTypeSchema(STRING)).toMatchInlineSnapshot(`
Object {
  "type": "string",
}
`);
    });

    test("string literal", () => {
      expect(jsonTypeSchema(stringLiteral("some literal")))
        .toMatchInlineSnapshot(`
Object {
  "const": "some literal",
  "type": "string",
}
`);
    });

    test("number", () => {
      expect(jsonTypeSchema(NUMBER)).toMatchInlineSnapshot(`
Object {
  "type": "number",
}
`);
    });

    test("number literal", () => {
      expect(jsonTypeSchema(numberLiteral(1.5))).toMatchInlineSnapshot(`
Object {
  "const": 1.5,
  "type": "number",
}
`);
      expect(jsonTypeSchema(numberLiteral(-23.1))).toMatchInlineSnapshot(`
Object {
  "const": -23.1,
  "type": "number",
}
`);
    });

    test("integer", () => {
      expect(jsonTypeSchema(INTEGER)).toMatchInlineSnapshot(`
Object {
  "type": "integer",
}
`);
    });

    test("number literal", () => {
      expect(jsonTypeSchema(numberLiteral(0))).toMatchInlineSnapshot(`
Object {
  "const": 0,
  "type": "integer",
}
`);
      expect(jsonTypeSchema(numberLiteral(123))).toMatchInlineSnapshot(`
Object {
  "const": 123,
  "type": "integer",
}
`);
      expect(jsonTypeSchema(numberLiteral(-1000))).toMatchInlineSnapshot(`
Object {
  "const": -1000,
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(jsonTypeSchema(objectType([]))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        jsonTypeSchema(
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
        jsonTypeSchema(
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
      expect(jsonTypeSchema(arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("union", () => {
      expect(jsonTypeSchema(unionType([STRING, NUMBER, BOOLEAN])))
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
      expect(
        jsonTypeSchema(referenceType("OtherType", "location", TypeKind.STRING))
      ).toMatchInlineSnapshot(`
Object {
  "$ref": "#/definitions/OtherType",
}
`);
    });
  });
});
