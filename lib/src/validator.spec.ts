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
} from "./models";
import { validate } from "./validator";

describe("Validator", () => {
  it("passes for trivial API", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/users/",
            },
            {
              kind: "dynamic",
              name: "userId",
              type: STRING,
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([]);
  });
  it("requires all path parameters to be typed", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/users/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: VOID,
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "Parameter userId must be a string or a number",
      "example does not define a type for path parameter :userId"
    ]);
  });
  it("rejects duplicate path parameters", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/users/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: NUMBER,
              description: "My description"
            },
            {
              kind: "static",
              content: "/profile/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: NUMBER,
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example defines the path parameter :userId multiple times"
    ]);
  });
  it("rejects non-string/number path parameters", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/hello/"
            },
            {
              kind: "dynamic",
              name: "paramNumber",
              type: NUMBER,
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramString",
              type: STRING,
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramStringConstant",
              type: stringConstant("abc"),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramIntegerContant",
              type: integerConstant(123),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramStringOrNumber",
              type: unionType(STRING, NUMBER),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramVoid",
              type: VOID,
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramNull",
              type: NULL,
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramBoolean",
              type: BOOLEAN,
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramBooleanConstantTrue",
              type: booleanConstant(true),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramBooleanConstantFalse",
              type: booleanConstant(false),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramObjectType",
              type: objectType({}),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramStringArray",
              type: arrayType(STRING),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramOptionalString",
              type: optionalType(STRING),
              description: "My description"
            },
            {
              kind: "dynamic",
              name: "paramStringOrObjectOrArray",
              type: unionType(STRING, objectType({}), arrayType(STRING)),
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "Parameter paramVoid must be a string or a number",
      "example does not define a type for path parameter :paramVoid",
      "Parameter paramNull must be a string or a number",
      "Parameter paramBoolean must be a string or a number",
      "Parameter paramBooleanConstantTrue must be a string or a number",
      "Parameter paramBooleanConstantFalse must be a string or a number",
      "Parameter paramObjectType must be a string or a number",
      "Parameter paramStringArray must be a string or a number",
      "Parameter paramOptionalString must be a string or a number",
      "Parameter paramStringOrObjectOrArray must be a string or a number"
    ]);
  });
  it("rejects duplicate headers", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [],
          headers: {
            header1: {
              headerFieldName: "duplicate",
              type: STRING
            },
            header2: {
              headerFieldName: "duplicate",
              type: STRING
            }
          },
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example defines the same header duplicate multiple times"
    ]);
  });
  it("rejects non-string headers", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [],
          headers: {
            headerRequiredString: {
              headerFieldName: "required-string",
              type: STRING
            },
            headerOptionalString: {
              headerFieldName: "optional-string",
              type: optionalType(STRING)
            },
            headerRequiredStringConstant: {
              headerFieldName: "required-string-constant",
              type: stringConstant("abc")
            },
            headerOptionalStringConstant: {
              headerFieldName: "optional-string-constant",
              type: optionalType(stringConstant("abc"))
            },
            headerUnionStringConstants: {
              headerFieldName: "union-string-constant",
              type: unionType(stringConstant("abc"), stringConstant("def"))
            },
            headerOptionalReferenceString: {
              headerFieldName: "optional-reference-string",
              type: optionalType(typeReference("StringAlias"))
            },
            headerNumber: {
              headerFieldName: "number",
              type: NUMBER
            },
            headerIntegerConstant: {
              headerFieldName: "integer-constant",
              type: integerConstant(123)
            },
            headerStringOrNumber: {
              headerFieldName: "string-or-number",
              type: unionType(STRING, NUMBER)
            },
            headerVoid: {
              headerFieldName: "void",
              type: VOID
            },
            headerNull: {
              headerFieldName: "null",
              type: NULL
            },
            headerBoolean: {
              headerFieldName: "boolean",
              type: BOOLEAN
            },
            headerBooleanConstantTrue: {
              headerFieldName: "boolean-constant-true",
              type: booleanConstant(true)
            },
            headerBooleanConstantFalse: {
              headerFieldName: "boolean-constant-false",
              type: booleanConstant(false)
            },
            headerObjectType: {
              headerFieldName: "object-type",
              type: objectType({})
            },
            headerStringArray: {
              headerFieldName: "string-array",
              type: arrayType(STRING)
            },
            headerStringOrObjectOrArray: {
              headerFieldName: "string-or-object-or-array",
              type: unionType(STRING, objectType({}), arrayType(STRING))
            }
          },
          queryParams: [],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {
        StringAlias: STRING
      }
    });
    expect(errors).toEqual([
      "Parameter headerNumber must be a string (either required or optional)",
      "Parameter headerIntegerConstant must be a string (either required or optional)",
      "Parameter headerStringOrNumber must be a string (either required or optional)",
      "Parameter headerVoid must be a string (either required or optional)",
      "Parameter headerNull must be a string (either required or optional)",
      "Parameter headerBoolean must be a string (either required or optional)",
      "Parameter headerBooleanConstantTrue must be a string (either required or optional)",
      "Parameter headerBooleanConstantFalse must be a string (either required or optional)",
      "Parameter headerObjectType must be a string (either required or optional)",
      "Parameter headerStringArray must be a string (either required or optional)",
      "Parameter headerStringOrObjectOrArray must be a string (either required or optional)"
    ]);
  });
  it("rejects duplicate query parameters", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/users/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: STRING,
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [
            {
              name: "limit",
              type: NUMBER
            },
            {
              name: "limit",
              type: NUMBER
            }
          ],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example defines the query parameter 'limit' multiple times"
    ]);
  });
  it("rejects query parameter with type void", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/users/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: STRING,
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [
            {
              name: "limit",
              type: VOID
            }
          ],
          requestType: VOID,
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example does not define a type for query parameter 'limit'"
    ]);
  });
  it("rejects request body for GET requests", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: [
            {
              kind: "static",
              content: "/"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: objectType({}),
          responseType: VOID,
          genericErrorType: VOID,
          specificErrorTypes: {}
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example cannot have a request body because its HTTP method is GET"
    ]);
  });
  it("finds missing types", () => {
    // Note: we make sure to cover all possible types, and all places where a type
    // can be set (params, request type, response type).
    const errors = validate({
      endpoints: {
        example1: {
          method: "POST",
          path: [
            {
              kind: "static",
              content: "/"
            },
            {
              kind: "dynamic",
              name: "param",
              type: typeReference("missing1"),
              description: "My description"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: typeReference("missing2"),
          responseType: objectType({
            example: typeReference("missing3")
          }),
          genericErrorType: typeReference("missing4"),
          specificErrorTypes: {}
        },
        example2: {
          method: "POST",
          path: [
            {
              kind: "static",
              content: "/"
            }
          ],
          headers: {},
          queryParams: [],
          requestType: optionalType(typeReference("missing5")),
          responseType: unionType(
            arrayType(typeReference("missing6")),
            arrayType(typeReference("missing7"))
          ),
          genericErrorType: VOID,
          specificErrorTypes: {
            forbidden: {
              statusCode: 403,
              type: typeReference("missing8")
            }
          }
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "Referenced type missing1 is not defined",
      "Parameter param must be a string or a number",
      "Referenced type missing2 is not defined",
      "Referenced type missing3 is not defined",
      "Referenced type missing4 is not defined",
      "Referenced type missing5 is not defined",
      "Referenced type missing6 is not defined",
      "Referenced type missing7 is not defined",
      "Referenced type missing8 is not defined"
    ]);
  });
});
