import { isRequestForEndpoint, normalisePath } from "./matcher";

const BASE_ENDPOINT = {
  name: "my-endpoint",
  description: "",
  path: "",
  request: {
    headers: [],
    pathParams: [],
    queryParams: []
  },
  responses: [],
  tags: [],
  tests: []
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
            path: "/users",
            draft: false
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
            path: "/users",
            draft: false
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
            path: "/users/:userId",
            draft: false
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
            path: "/users/:userId/details",
            draft: false
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
            path: "/users",
            draft: false
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
            path: "/users",
            draft: false
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
            path: "/users",
            draft: false
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
            path: "/users",
            draft: false
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
            path: "/users/abc",
            draft: false
          }
        )
      ).toBeFalsy();
    });
  });

  describe("normalisePath", () => {
    it("Performs a no-op with no slashes", () => {
      expect(normalisePath("")).toBe("");
      expect(normalisePath("chicken little")).toBe("chicken little");
    });

    it("Normalises more than one slash at various positions within the string", () => {
      expect(normalisePath("//foo/bar")).toBe("/foo/bar");
      expect(normalisePath("////foo/bar")).toBe("/foo/bar");
      expect(normalisePath("/foo/////bar")).toBe("/foo/bar");
      expect(normalisePath("/foo/bar//")).toBe("/foo/bar/");
    });

    it("Normalises more than one slash at multiple positions within the string", () => {
      expect(normalisePath("//foo//bar")).toBe("/foo/bar");
      expect(normalisePath("////foo////bar")).toBe("/foo/bar");
    });
  });
});
