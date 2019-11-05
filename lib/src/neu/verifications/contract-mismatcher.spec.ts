import { parse } from "../parser";
import {
  ContractMismatcher,
  pathMatchesVariablePath
} from "./contract-mismatcher";

const EXAMPLE_CONTRACT_PATH = "./lib/src/__examples__/contract.ts";

describe("contract mismatch finder", () => {
  let mismatcher: ContractMismatcher;
  beforeAll(() => {
    mismatcher = new ContractMismatcher(parse(EXAMPLE_CONTRACT_PATH));
  });

  test("pathMatchesVariablePath should match correct paths", () => {
    // non-variable
    expect(pathMatchesVariablePath("/a/b/c", "/a/b/c")).toBeTruthy();

    // one variable path
    expect(pathMatchesVariablePath("/a/:b/c", "/a/0/c")).toBeTruthy();

    // two variable paths
    expect(pathMatchesVariablePath("/a/:b/c/:d", "/a/0/c/0")).toBeTruthy();
  });

  test("pathMatchesVariablePath should not match incorrect paths", () => {
    // non-variable with prefix
    expect(pathMatchesVariablePath("/a/b/c", "/z/a/b/c")).toBeFalsy();

    // non-variable with postfix
    expect(pathMatchesVariablePath("/a/b/c", "/a/b/c/d")).toBeFalsy();

    // variable with prefix
    expect(pathMatchesVariablePath("/a/:b/c", "/z/a/0/c")).toBeFalsy();

    // variable with postfix
    expect(pathMatchesVariablePath("/a/:b/c", "/a/0/c/d")).toBeFalsy();
  });

  test("no mismatch found", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: [
        {
          name: "x-auth-token",
          value: "token"
        }
      ],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed",
          createdAt: "2020-01-01"
        }
      }
    };
    const response = {
      headers: [{ name: "Location", value: "testLocation" }],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(0);
  });

  test("a violation is found, missing 1 property on request body.", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: [{ name: "x-auth-token", value: "token" }],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      }
    };
    const response = {
      headers: [{ name: "Location", value: "testLocation" }],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      `Request body type disparity:\n${JSON.stringify(
        {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        },
        undefined,
        2
      )}\n- #.data should have required property 'age'`
    );
  });

  test("a mismatch is found, request body property type is incorrect (date)", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: [{ name: "x-auth-token", value: "token" }],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed",
          createdAt: "invalidDate"
        }
      }
    };
    const response = {
      headers: [{ name: "Location", value: "testLocation" }],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      'Request body type disparity:\n{\n  "data": {\n    "firstName": "Maple",\n    "lastName": "Syrup",\n    "age": 1,\n    "email": "maple.syrup@airtasker.com",\n    "address": "Doggo bed",\n    "createdAt": "invalidDate"\n  }\n}\n- #.data.createdAt should match format "date"'
    );
  });

  test("a violation is found, no matching path on the contract", () => {
    const request = {
      path: "/compan/5/users",
      method: "POST",
      headers: [{ name: "x-auth-token", value: "token" }],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      }
    };
    const response = {
      headers: [{ name: "Location", value: "testLocation" }],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      "Endpoint POST /compan/5/users not found."
    );
  });

  test("a violation is found, when path is similar but contains a prefix", () => {
    const request = {
      path: "/some/prefix/company/5/users",
      method: "POST",
      headers: [{ name: "x-auth-token", value: "token" }],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      }
    };
    const response = {
      headers: [{ name: "Location", value: "testLocation" }],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    const unwrappedResult = result.unwrapOrThrow();
    expect(unwrappedResult.violations).toHaveLength(1);
    expect(unwrappedResult.violations[0].message).toBe(
      "Endpoint POST /some/prefix/company/5/users not found."
    );
  });

  test("a request header violation found, missing required header", () => {
    const request = {
      path: "/company/5",
      method: "GET",
      headers: []
    };
    const response = {
      headers: [{ name: "accept", value: "1" }],
      statusCode: 201,
      body: {
        data: {
          id: "5"
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      'Required request header "x-id" missing'
    );
  });

  test("a request header violation found, wrong header value type", () => {
    const request = {
      path: "/company/5",
      method: "GET",
      headers: [{ name: "x-id", value: "NaN" }]
    };
    const response = {
      headers: [{ name: "accept", value: "1" }],
      statusCode: 201,
      body: {
        data: {
          id: "5"
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      'Request header "x-id" type disparity: "x-id" should be float'
    );
  });

  test("a response header violation found, missing required header", () => {
    const request = {
      path: "/company/5",
      method: "GET",
      headers: [{ name: "x-id", value: "5" }]
    };
    const response = {
      headers: [],
      statusCode: 201,
      body: {
        data: {
          id: "5"
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      'Required response header "accept" missing'
    );
  });

  test("a response header violation found, wrong header value type", () => {
    const request = {
      path: "/company/5",
      method: "GET",
      headers: [{ name: "x-id", value: "5" }]
    };
    const response = {
      headers: [{ name: "accept", value: "NaN" }],
      statusCode: 201,
      body: {
        data: {
          id: "5"
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(1);
    expect(result.unwrapOrThrow().violations[0].message).toBe(
      'Response header "accept" type disparity: "accept" should be float'
    );
  });

  test("having an extra response header that's not defined in the contract is not a violation", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: [{ name: "x-auth-token", value: "token" }],
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      }
    };
    const response = {
      headers: [
        { name: "Location", value: "testLocation" },
        { name: "ExtraHeader", value: "testExtraHeader" }
      ],
      statusCode: 201,
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          profile: { private: false, messageOptions: { newsletter: false } }
        }
      }
    };
    const result = mismatcher.findViolations(request, response);
    expect(result.unwrapOrThrow().violations).toHaveLength(0);
  });

  describe("a violation is found, query params do not conform to contract", () => {
    test("query param does not exist under endpoint", () => {
      const request = {
        path: "/company/0/users?id=query+param+array+pipe",
        method: "POST",
        headers: [{ name: "x-auth-token", value: "token" }],
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        }
      };

      const response = {
        headers: [{ name: "Location", value: "testLocation" }],
        statusCode: 201,
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            profile: { private: false, messageOptions: { newsletter: false } }
          }
        }
      };

      const result = mismatcher.findViolations(request, response);
      expect(result.unwrapOrThrow().violations).toHaveLength(1);
      expect(result.unwrapOrThrow().violations[0].message).toBe(
        'Query param "id" not defined in contract request query params'
      );
    });

    test("query param type is incorrect (object)", () => {
      const request = {
        path: "/company/0/users?user[id]=invalid&user[slug]=2",
        method: "POST",
        headers: [{ name: "x-auth-token", value: "token" }],
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        }
      };

      const response = {
        headers: [{ name: "Location", value: "testLocation" }],
        statusCode: 201,
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            profile: { private: false, messageOptions: { newsletter: false } }
          }
        }
      };

      const result = mismatcher.findViolations(request, response);
      expect(result.unwrapOrThrow().violations).toHaveLength(1);
      expect(result.unwrapOrThrow().violations[0].message).toBe(
        'Query param "user" type disparity: ".user.id" should be float'
      );
    });

    test("query param type is incorrect (array)", () => {
      const request = {
        path: "/company/0/users?user[id]=0&user[slug]=2&ids[0]=false&ids[1]=1",
        method: "POST",
        headers: [{ name: "x-auth-token", value: "token" }],
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        }
      };

      const response = {
        headers: [{ name: "Location", value: "testLocation" }],
        statusCode: 201,
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            profile: { private: false, messageOptions: { newsletter: false } }
          }
        }
      };

      const result = mismatcher.findViolations(request, response);
      expect(result.unwrapOrThrow().violations).toHaveLength(1);
      expect(result.unwrapOrThrow().violations[0].message).toBe(
        'Query param "ids" type disparity: "ids[0]" should be float'
      );
    });

    test("query param type is incorrect (date)", () => {
      const request = {
        path: "/company/0/users?date=11-13",
        method: "POST",
        headers: [{ name: "x-auth-token", value: "token" }],
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        }
      };

      const response = {
        headers: [{ name: "Location", value: "testLocation" }],
        statusCode: 201,
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            profile: { private: false, messageOptions: { newsletter: false } }
          }
        }
      };

      const result = mismatcher.findViolations(request, response);
      expect(result.unwrapOrThrow().violations).toHaveLength(1);
      expect(result.unwrapOrThrow().violations[0].message).toBe(
        'Query param "date" type disparity: "date" should be date'
      );
    });
  });
});
