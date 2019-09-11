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
      path: "/company/:companyId/users",
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
      pathParams: "5",
      queryParams: ""
    };
    const response = {
      headers: '{"Location":"testLocation"}',
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
      path: "/company/:companyId/users",
      method: "POST",
      headers: {},
      body: {
        data: {
          firstName: "Maple",
          lastName: "Syrup",
          email: "maple.syrup@airtasker.com",
          address: "Doggo bed"
        }
      },
      pathParams: "5",
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
});
