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
      path: "/company/shouldbenumber/users",
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
      '{"data":{"firstName":"Maple","lastName":"Syrup","email":"maple.syrup@airtasker.com","address":"Doggo bed"}} should have required property \'age\''
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
          age: "1.0",
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
    console.log(result);
    expect(result.unwrapOrThrow().length).toBe(1);
    expect(result.unwrapOrThrow()[0].message).toBe(
      "{} does not conform to the request contract headers on path: /company/:companyId/users:POST"
    );
  });
});
