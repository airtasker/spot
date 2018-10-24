import * as fs from "fs-extra";
import * as path from "path";
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
import { parsePath } from "../../parser";
import { generateJsonSchema, jsonTypeSchema } from "./json-schema";

const EXAMPLES_DIR = path.join(__dirname, "..", "..", "..", "..", "examples");

describe("JSON Schema generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        expect(generateJsonSchema(api, "json")).toMatchSnapshot("json");
        expect(generateJsonSchema(api, "yaml")).toMatchSnapshot("yaml");
      });
    }
  });

  describe("generates type validator", () => {
    test("void", () => {
      expect(jsonTypeSchema(VOID)).toMatchInlineSnapshot(`
Object {
  "type": "null",
}
`);
    });

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

    test("boolean constant", () => {
      expect(jsonTypeSchema(booleanConstant(true))).toMatchInlineSnapshot(`
Object {
  "const": true,
  "type": "boolean",
}
`);
      expect(jsonTypeSchema(booleanConstant(false))).toMatchInlineSnapshot(`
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

    test("string constant", () => {
      expect(jsonTypeSchema(stringConstant("some constant")))
        .toMatchInlineSnapshot(`
Object {
  "const": "some constant",
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

    test("integer constant", () => {
      expect(jsonTypeSchema(integerConstant(0))).toMatchInlineSnapshot(`
Object {
  "const": 0,
  "type": "integer",
}
`);
      expect(jsonTypeSchema(integerConstant(123))).toMatchInlineSnapshot(`
Object {
  "const": 123,
  "type": "integer",
}
`);
      expect(jsonTypeSchema(integerConstant(-1000))).toMatchInlineSnapshot(`
Object {
  "const": -1000,
  "type": "integer",
}
`);
    });

    test("object", () => {
      expect(jsonTypeSchema(objectType({}))).toMatchInlineSnapshot(`
Object {
  "properties": Object {},
  "required": Array [],
  "type": "object",
}
`);
      expect(
        jsonTypeSchema(
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
        jsonTypeSchema(
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
      expect(jsonTypeSchema(arrayType(STRING))).toMatchInlineSnapshot(`
Object {
  "items": Object {
    "type": "string",
  },
  "type": "array",
}
`);
    });

    test("optional", () => {
      expect(() => jsonTypeSchema(optionalType(STRING))).toThrowError(
        "Unsupported top-level optional type"
      );
    });

    test("union", () => {
      expect(jsonTypeSchema(unionType(STRING, NUMBER, BOOLEAN)))
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
      expect(jsonTypeSchema(typeReference("OtherType"))).toMatchInlineSnapshot(`
Object {
  "$ref": "#/definitions/OtherType",
}
`);
    });
  });
});
