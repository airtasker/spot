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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(0);
  });

  test("a mismatch is found, missing 1 property on request body.", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
  });

  test("a mismatch is found, no matching path on the contract", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "Endpoint POST /compan/5/users not found."
    );
  });

  test("A mismatch is found, when path is similar but contains a prefix", () => {
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
    const result = mismatcher.findMismatch(request, response);
    const unwrappedResult = result.unwrapOrThrow();
    expect(unwrappedResult).toHaveLength(1);
    expect(unwrappedResult[0].message).toBe(
      "Endpoint POST /some/prefix/company/5/users not found."
    );
  });

  test("a mismatch is found, path params do not conform to contract", () => {
    const request = {
      path: "/company/true/users",
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      '{"data":{"firstName":"Maple","lastName":"Syrup","email":"maple.syrup@airtasker.com","address":"Doggo bed"}}: #/properties/data/required should have required property \'age\''
    );
  });

  test("a request header mismatch found, missing required header", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      'Header "x-id" missing on endpoint'
    );
  });

  test("a request header mismatch found, wrong header value type", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe('"x-id" should be float');
  });

  test("a response header mismatch found, missing required header", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      'Header "accept" missing on endpoint'
    );
  });

  test("a response header mismatch found, wrong header value type", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(1);
    expect(result.unwrapOrThrow()[0].message).toBe('"accept" should be float');
  });

  test("having an extra response header that's not defined in the contract is not a mismatch", () => {
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
    const result = mismatcher.findMismatch(request, response);
    expect(result.unwrapOrThrow()).toHaveLength(0);
  });

  describe("a mismatch is found, query params do not conform to contract", () => {
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

      const result = mismatcher.findMismatch(request, response);
      expect(result.unwrapOrThrow()).toHaveLength(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        'Query parameter "id" does not exist under the specified endpoint.'
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

      const result = mismatcher.findMismatch(request, response);
      expect(result.unwrapOrThrow()).toHaveLength(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        '".user.id" should be float'
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

      const result = mismatcher.findMismatch(request, response);
      expect(result.unwrapOrThrow()).toHaveLength(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        '"ids[0]" should be float'
      );
    });
  });
});
