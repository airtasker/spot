import { optionalType, referenceType, STRING, VOID } from "./models";
import { validate } from "./validator";

describe("Validator", () => {
  it("passes for trivial API", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: "/users/:userId",
          pathParameters: [
            {
              name: "userId",
              type: STRING
            }
          ],
          requestType: VOID,
          responseType: VOID
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
          path: "/users/:userId",
          pathParameters: [],
          requestType: VOID,
          responseType: VOID
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example does not define a type for path parameter :userId"
    ]);
  });
  it("rejects extraneous path parameters", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: "/users",
          pathParameters: [
            {
              name: "userId",
              type: STRING
            }
          ],
          requestType: VOID,
          responseType: VOID
        }
      },
      types: {}
    });
    expect(errors).toEqual([
      "example does not have a parameter named :userId in its path"
    ]);
  });
  it("rejects request body for GET requests", () => {
    const errors = validate({
      endpoints: {
        example: {
          method: "GET",
          path: "/",
          pathParameters: [],
          requestType: {
            kind: "object",
            properties: {}
          },
          responseType: VOID
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
          path: "/:param",
          pathParameters: [
            {
              name: "param",
              type: referenceType("missing1")
            }
          ],
          requestType: referenceType("missing2"),
          responseType: {
            kind: "object",
            properties: {
              example: referenceType("missing3")
            }
          }
        },
        example2: {
          method: "POST",
          path: "/",
          pathParameters: [],
          requestType: optionalType(referenceType("missing4")),
          responseType: {
            kind: "array",
            elements: referenceType("missing5")
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
      "Referenced type missing5 is not defined"
    ]);
  });
});
