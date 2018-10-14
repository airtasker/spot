import {
  arrayType,
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
