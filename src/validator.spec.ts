import {
  arrayType,
  BOOLEAN,
  NULL,
  NUMBER,
  objectType,
  optionalType,
  STRING,
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
              content: "/users/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: STRING
            }
          ],
          requestType: VOID,
          responseType: VOID,
          defaultErrorType: VOID,
          customErrorTypes: {}
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
              type: VOID
            }
          ],
          requestType: VOID,
          responseType: VOID,
          defaultErrorType: VOID,
          customErrorTypes: {}
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
              type: NUMBER
            },
            {
              kind: "static",
              content: "/profile/"
            },
            {
              kind: "dynamic",
              name: "userId",
              type: NUMBER
            }
          ],
          requestType: VOID,
          responseType: VOID,
          defaultErrorType: VOID,
          customErrorTypes: {}
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
              type: NUMBER
            },
            {
              kind: "dynamic",
              name: "paramString",
              type: STRING
            },
            {
              kind: "dynamic",
              name: "paramStringConstant",
              type: {
                kind: "string-constant",
                value: "abc"
              }
            },
            {
              kind: "dynamic",
              name: "paramIntegerContant",
              type: {
                kind: "integer-constant",
                value: 123
              }
            },
            {
              kind: "dynamic",
              name: "paramStringOrNumber",
              type: unionType(STRING, NUMBER)
            },
            {
              kind: "dynamic",
              name: "paramVoid",
              type: VOID
            },
            {
              kind: "dynamic",
              name: "paramNull",
              type: NULL
            },
            {
              kind: "dynamic",
              name: "paramBoolean",
              type: BOOLEAN
            },
            {
              kind: "dynamic",
              name: "paramBooleanConstantTrue",
              type: {
                kind: "boolean-constant",
                value: true
              }
            },
            {
              kind: "dynamic",
              name: "paramBooleanConstantFalse",
              type: {
                kind: "boolean-constant",
                value: false
              }
            },
            {
              kind: "dynamic",
              name: "paramObjectType",
              type: objectType({})
            },
            {
              kind: "dynamic",
              name: "paramStringArray",
              type: arrayType(STRING)
            },
            {
              kind: "dynamic",
              name: "paramOptionalString",
              type: optionalType(STRING)
            },
            {
              kind: "dynamic",
              name: "paramStringOrObjectOrArray",
              type: unionType(STRING, objectType({}), arrayType(STRING))
            }
          ],
          requestType: VOID,
          responseType: VOID,
          defaultErrorType: VOID,
          customErrorTypes: {}
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
          requestType: objectType({}),
          responseType: VOID,
          defaultErrorType: VOID,
          customErrorTypes: {}
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
              type: typeReference("missing1")
            }
          ],
          requestType: typeReference("missing2"),
          responseType: objectType({
            example: typeReference("missing3")
          }),
          defaultErrorType: typeReference("missing4"),
          customErrorTypes: {}
        },
        example2: {
          method: "POST",
          path: [
            {
              kind: "static",
              content: "/"
            }
          ],
          requestType: optionalType(typeReference("missing5")),
          responseType: unionType(
            arrayType(typeReference("missing6")),
            arrayType(typeReference("missing7"))
          ),
          defaultErrorType: VOID,
          customErrorTypes: {
            403: typeReference("missing8")
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
