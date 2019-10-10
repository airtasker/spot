import { parse } from "../parser";
import { ContractMismatcher } from "./contract-mismatcher";

const EXAMPLE_CONTRACT_PATH = "./lib/src/__examples__/contract.ts";

describe("contract mismatch finder", () => {
  let mismatcher: ContractMismatcher;
  beforeAll(() => {
    mismatcher = new ContractMismatcher(parse(EXAMPLE_CONTRACT_PATH));
  });

  test("no mismatch found", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": "token" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(0);
  });

  test("a mismatch is found, missing 1 property on request body.", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": "token" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(1);
  });

  test("a mismatch is found, no matching path on the contract", () => {
    const request = {
      path: "/compan/5/users",
      method: "POST",
      headers: { "x-auth-token": "token" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "Endpoint /compan/5/users with Http Method of POST does not exist under the specified contract."
    );
  });

  test("a mismatch is found, path params do not conform to contract", () => {
    const request = {
      path: "/company/true/users",
      method: "POST",
      headers: { "x-auth-token": "token" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      '{"data":{"firstName":"Maple","lastName":"Syrup","email":"maple.syrup@airtasker.com","address":"Doggo bed"}}: #/properties/data/required should have required property \'age\''
    );
  });

  test("a request header mismatch found, missing required header", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: {},
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "{} does not conform to the request contract headers on path: /company/:companyId/users:POST"
    );
  });

  test("a request header mismatch found, wrong header value type", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": 1 },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation" },
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "1: #/type should be string"
    );
  });

  test("a response header mismatch found, missing required header", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": "test-correct" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: {},
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "Missing response header of Location on /company/:companyId/users:POST"
    );
  });

  test("a response header mismatch found, wrong header value type", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": "test-correct" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: 123 },
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
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "123: #/type should be string"
    );
  });

  test("having an extra response header that's not defined in the contract is not a mismatch", () => {
    const request = {
      path: "/company/5/users",
      method: "POST",
      headers: { "x-auth-token": "token" },
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          age: 1.0,
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      queryParams: ""
    };
    const response = {
      headers: { Location: "testLocation", ExtraHeader: "testExtraHeader" },
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
    expect(result.unwrapOrThrow().length).toBe(0);
  });

  describe("a mismatch is found, query params do not conform to contract", () => {
    test("query param does not exist under endpoint", () => {
      const request = {
        path: "/company/0/users?id=query+param+array+pipe",
        method: "POST",
        headers: { "x-auth-token": "token" },
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        },
        queryParams: ""
      };

      const response = {
        headers: { Location: "testLocation" },
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
      expect(result.unwrapOrThrow().length).toBe(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        'Query parameter "id" does not exist under the specified endpoint.'
      );
    });

    test("query param type is incorrect (object)", () => {
      const request = {
        path: "/company/0/users?user[id]=invalid&user[slug]=2",
        method: "POST",
        headers: { "x-auth-token": "token" },
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        },
        queryParams: ""
      };

      const response = {
        headers: { Location: "testLocation" },
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
      expect(result.unwrapOrThrow().length).toBe(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        '".user.id" should be float'
      );
    });

    test("query param type is incorrect (array)", () => {
      const request = {
        path: "/company/0/users?user[id]=0&user[slug]=2&ids[0]=false&ids[1]=1",
        method: "POST",
        headers: { "x-auth-token": "token" },
        body: {
          data: {
            firstName: "Maple",
            lastName: "Syrup",
            age: 1.0,
            email: "maple.syrup@airtasker.com",
            address: "Doggo bed"
          }
        },
        queryParams: ""
      };

      const response = {
        headers: { Location: "testLocation" },
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
      expect(result.unwrapOrThrow().length).toBe(1);
      expect(result.unwrapOrThrow()[0].message).toBe(
        '"ids[0]" should be float'
      );
    });
  });
});
