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
import { generateValidatorsSource } from "./validators";

const EXAMPLES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "examples",
  "src"
);

describe("TypeScript validators generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        const source = generateValidatorsSource(api);
        expect(source).toMatchSnapshot();
      });
    }
  });

  it("generates types for endpoints", () => {
    expect(
      generateValidatorsSource({
        endpoints: {
          example: {
            method: "POST",
            path: [],
            headers: {},
            queryParams: [],
            requestType: VOID,
            responseType: VOID,
            genericErrorType: VOID,
            specificErrorTypes: {
              forbidden: {
                statusCode: 403,
                type: VOID
              },
              notFound: {
                statusCode: 404,
                type: VOID
              }
            }
          }
        },
        types: {}
      })
    ).toMatchInlineSnapshot(`
"export function validateExample_request(value: any): value is void {
    return value === undefined;
}

export function validateExample_response(value: any): value is void {
    return value === undefined;
}

export function validateExample_genericError(value: any): value is void {
    return value === undefined;
}

export function validateExample_specificErrorForbidden(value: any): value is void {
    return value === undefined;
}

export function validateExample_specificErrorNotFound(value: any): value is void {
    return value === undefined;
}"
`);
  });

  describe("generates type validator", () => {
    test("void", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: VOID
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === undefined;
}"
`);
    });

    test("null", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: NULL
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === null;
}"
`);
    });

    test("boolean", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: BOOLEAN
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return typeof value === \\"boolean\\";
}"
`);
    });

    test("boolean constant", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: booleanConstant(true)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === true;
}"
`);
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: booleanConstant(false)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === false;
}"
`);
    });

    test("string", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: STRING
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return typeof value === \\"string\\";
}"
`);
    });

    test("string constant", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: stringConstant("some constant")
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === \\"some constant\\";
}"
`);
    });

    test("number", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: NUMBER
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return typeof value === \\"number\\";
}"
`);
    });

    test("integer constant", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: integerConstant(0)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === 0;
}"
`);
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: integerConstant(123)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === 123;
}"
`);
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: integerConstant(-1000)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === -1000;
}"
`);
    });

    test("object", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: objectType({})
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return !(value === null) && typeof value === \\"object\\";
}"
`);
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: objectType({
              singleField: NUMBER
            })
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return !(value === null) && typeof value === \\"object\\" && typeof value[\\"singleField\\"] === \\"number\\";
}"
`);
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: objectType({
              field1: NUMBER,
              field2: STRING,
              field3: BOOLEAN
            })
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return !(value === null) && typeof value === \\"object\\" && typeof value[\\"field1\\"] === \\"number\\" && typeof value[\\"field2\\"] === \\"string\\" && typeof value[\\"field3\\"] === \\"boolean\\";
}"
`);
    });

    test("array", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: arrayType(STRING)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value instanceof Array && value.reduce((acc, curr) => acc && typeof curr === \\"string\\", true);
}"
`);
    });

    test("optional", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: optionalType(STRING)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return value === undefined || typeof value === \\"string\\";
}"
`);
    });

    test("union", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: unionType(STRING, NUMBER, BOOLEAN)
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return typeof value === \\"string\\" || typeof value === \\"number\\" || typeof value === \\"boolean\\";
}"
`);
    });

    test("type reference", () => {
      expect(
        generateValidatorsSource({
          endpoints: {},
          types: {
            Example: typeReference("OtherType")
          }
        })
      ).toMatchInlineSnapshot(`
"import { Example } from \\"./types\\";

export function validateExample(value: any): value is Example {
    return validateOtherType(value);
}"
`);
    });
  });
});
