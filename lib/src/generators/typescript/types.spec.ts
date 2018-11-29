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
import { parsePath } from "../../parsing/file-parser";
import { generateTypesSource } from "./types";

const EXAMPLES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "examples",
  "src"
);

describe("TypeScript types generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, `${testCaseName}-api.ts`)
        );
        const source = generateTypesSource(api);
        expect(source).toMatchSnapshot();
      });
    }
  });

  it("does not generate types for endpoints", () => {
    expect(
      generateTypesSource({
        endpoints: {
          example: {
            method: "POST",
            path: [],
            description: "",
            headers: {},
            queryParams: [],
            requestType: STRING,
            responseType: STRING,
            genericErrorType: STRING,
            specificErrorTypes: {
              forbidden: {
                statusCode: 403,
                type: STRING
              },
              notFound: {
                statusCode: 404,
                type: STRING
              }
            }
          }
        },
        types: {},
        description: {
          name: "name",
          description: "description"
        }
      })
    ).toMatchInlineSnapshot(`""`);
  });

  describe("generates type validator", () => {
    test("void", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: VOID
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = void;"`);
    });

    test("null", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: NULL
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = null;"`);
    });

    test("boolean", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: BOOLEAN
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = boolean;"`);
    });

    test("boolean constant", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: booleanConstant(true)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = true;"`);
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: booleanConstant(false)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = false;"`);
    });

    test("string", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: STRING
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = string;"`);
    });

    test("string constant", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: stringConstant("some constant")
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = \\"some constant\\";"`);
    });

    test("number", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: NUMBER
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = number;"`);
    });

    test("integer constant", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: integerConstant(0)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = 0;"`);
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: integerConstant(123)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = 123;"`);
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: integerConstant(-1000)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = -1000;"`);
    });

    test("object", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: objectType({})
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = {};"`);
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: objectType({
              singleField: NUMBER
            })
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`
"export type Example = {
    singleField: number;
};"
`);
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: objectType({
              field1: NUMBER,
              field2: STRING,
              field3: optionalType(BOOLEAN)
            })
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`
"export type Example = {
    field1: number;
    field2: string;
    field3?: boolean;
};"
`);
    });

    test("array", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: arrayType(STRING)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = string[];"`);
    });

    test("optional", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: optionalType(STRING)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = string | void;"`);
    });

    test("union", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: unionType(STRING, NUMBER, BOOLEAN)
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(
        `"export type Example = string | number | boolean;"`
      );
    });

    test("type reference", () => {
      expect(
        generateTypesSource({
          endpoints: {},
          types: {
            Example: typeReference("OtherType")
          },
          description: {
            name: "name",
            description: "description"
          }
        })
      ).toMatchInlineSnapshot(`"export type Example = OtherType;"`);
    });
  });
});
