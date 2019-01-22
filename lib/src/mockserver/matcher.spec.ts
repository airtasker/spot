import { INT32, VOID } from "../models";
import { isRequestForEndpoint } from "./matcher";

const BASE_ENDPOINT = {
  description: "",
  genericErrorType: VOID,
  headers: {},
  queryParams: [],
  requestType: VOID,
  responseType: VOID,
  specificErrorTypes: {}
};

describe("Matcher", () => {
  describe("isRequestForEndpoint", () => {
    it("identifies correct matches", () => {
      expect(
        isRequestForEndpoint(
          {
            method: "get",
            path: "/users"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeTruthy();
      expect(
        isRequestForEndpoint(
          {
            method: "get",
            path: "/api/v2/users"
          },
          "/api/v2",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeTruthy();
      expect(
        isRequestForEndpoint(
          {
            method: "post",
            path: "/users/123"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "POST",
            path: [
              {
                kind: "static",
                content: "/users/"
              },
              {
                kind: "dynamic",
                description: "",
                name: "userId",
                type: INT32
              }
            ]
          }
        )
      ).toBeTruthy();
      expect(
        isRequestForEndpoint(
          {
            method: "post",
            path: "/users/123/details"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "POST",
            path: [
              {
                kind: "static",
                content: "/users/"
              },
              {
                kind: "dynamic",
                description: "",
                name: "userId",
                type: INT32
              },
              {
                kind: "static",
                content: "/details"
              }
            ]
          }
        )
      ).toBeTruthy();
    });
    it("rejects wrong method", () => {
      expect(
        isRequestForEndpoint(
          {
            method: "POST",
            path: "/users"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeFalsy();
    });
    it("rejects wrong prefix", () => {
      expect(
        isRequestForEndpoint(
          {
            method: "POST",
            path: "/users"
          },
          "/api/v2",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeFalsy();
      expect(
        isRequestForEndpoint(
          {
            method: "POST",
            path: "/api/v3/users"
          },
          "/api/v2",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeFalsy();
    });
    it("rejects wrong path", () => {
      expect(
        isRequestForEndpoint(
          {
            method: "GET",
            path: "/users/abc"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              }
            ]
          }
        )
      ).toBeFalsy();
      expect(
        isRequestForEndpoint(
          {
            method: "GET",
            path: "/users"
          },
          "",
          {
            ...BASE_ENDPOINT,
            method: "GET",
            path: [
              {
                kind: "static",
                content: "/users"
              },
              {
                kind: "static",
                content: "/abc"
              }
            ]
          }
        )
      ).toBeFalsy();
    });
  });
});
