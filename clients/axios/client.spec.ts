import { SpotApi } from "./sdk/client";
import * as moxios from "moxios";
import { CreateUserResponse } from "./sdk/types";

const createUserResponse: CreateUserResponse = {
  success: true,
  created_at: "2018-01-01"
};

const configuredApi = new SpotApi({ baseUrl: "http://localhost:9999/api" });

describe("TypeScript axios client sdk test", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  describe("POST createUser", () => {
    it("calls the correct url", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: createUserResponse
      });

      await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );

      const request = moxios.requests.mostRecent();
      expect(request.config.url).toBe("http://localhost:9999/api/users/create");
    });

    it("passes the correct method and request body", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: createUserResponse
      });

      await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(JSON.parse(request.config.data)).toStrictEqual({
        name: "User 1",
        roles: "admin"
      });
    });

    it("passes the correct header", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: createUserResponse
      });

      await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBe("test-token");
    });

    it("allows undefined header", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: createUserResponse
      });

      await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        undefined
      );
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBeUndefined();
    });

    it("can handle successful request", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: createUserResponse
      });

      const response = await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(createUserResponse);
    });

    it("throws error when response is not CreateUserResponse", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: {}
      });

      try {
        await configuredApi.createUser(
          { name: "User 1", roles: "admin" },
          "test-token"
        );
      } catch (e) {
        expect(e).toEqual(
          new Error("Invalid response for successful status code: {}")
        );
      }
    });

    it("can handle unsuccessful request", async () => {
      moxios.stubRequest(/.*/, {
        status: 400
      });

      const response = await configuredApi.createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("GET findUsers", () => {
    it("calls the correct url", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: [
          {
            name: "first_user",
            age: 23
          }
        ]
      });

      await configuredApi.findUsers(10, "user");

      const request = moxios.requests.mostRecent();
      expect(request.config.url).toBe("http://localhost:9999/api/users");
    });

    it("passes the correct method and queryParams", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: [
          {
            name: "first_user",
            age: 23
          }
        ]
      });

      await configuredApi.findUsers(10, "user");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("get");
      expect(request.config.url).toContain("/users");
      expect(request.config.params).toStrictEqual({
        limit: 10,
        search_term: "user"
      });
    });

    it("allows optional queryParams", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: [
          {
            name: "first_user",
            age: 23
          }
        ]
      });

      await configuredApi.findUsers(10, undefined);

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("get");
      expect(request.config.url).toContain("/users");
      expect(request.config.params).toStrictEqual({
        limit: 10,
        search_term: undefined
      });
    });

    it("can handle successful request", async () => {
      const expected = [
        {
          name: "first_user",
          age: 23
        },
        {
          name: "second_user",
          age: 50
        }
      ];
      moxios.stubRequest(/.*/, {
        status: 200,
        response: expected
      });

      const response = await configuredApi.findUsers(10, "user");
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("can handle successful request with optional response", async () => {
      const expected = [
        {
          name: "first_user",
          age: 23
        },
        {
          name: "second_user"
        }
      ];
      moxios.stubRequest(/.*/, {
        status: 200,
        response: expected
      });

      const response = await configuredApi.findUsers(10, "user");
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("can handle unsuccessful request", async () => {
      moxios.stubRequest(/.*/, {
        status: 400
      });

      const response = await configuredApi.findUsers(10, "user");
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("GET getUser", () => {
    it("passes the correct method and pathParam", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: {
          name: "first_user",
          age: 23
        }
      });

      await configuredApi.getUser(123);

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("get");
      expect(request.config.url).toBe("http://localhost:9999/api/users/123");
    });

    it("can handle successful request", async () => {
      const expected = {
        name: "first_user",
        age: 23
      };
      moxios.stubRequest(/.*/, {
        status: 200,
        response: expected
      });

      const response = await configuredApi.getUser(123);
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("can handle successful request with optional response", async () => {
      const expected = {
        name: "first_user"
      };
      moxios.stubRequest(/.*/, {
        status: 200,
        response: expected
      });

      const response = await configuredApi.getUser(123);
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("throws error when response schema is not correct", async () => {
      const response = {
        name: "first_user",
        age: "23"
      };

      moxios.stubRequest(/.*/, {
        status: 200,
        response: response
      });

      try {
        await configuredApi.getUser(123);
      } catch (e) {
        expect(e).toEqual(
          new Error(
            `Invalid response for successful status code: ${JSON.stringify(
              response,
              null,
              2
            )}`
          )
        );
      }
    });

    it("can handle unsuccessful request", async () => {
      moxios.stubRequest(/.*/, {
        status: 400
      });

      const response = await configuredApi.getUser(123);
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("DELETE deleteUser", () => {
    it("passes the correct method and pathParam", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: null
      });

      await configuredApi.deleteUser(123, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("delete");
      expect(request.config.url).toBe(
        "http://localhost:9999/api/users/123-confirmed"
      );
    });

    it("passes the correct header", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: null
      });

      await configuredApi.deleteUser(123, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.headers["Authorization"]).toBe("test-token");
    });

    it("can handle successful request", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: null
      });

      const response = await configuredApi.deleteUser(123, "test-token");
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(null);
    });

    it("throws error when response schema is not correct", async () => {
      moxios.stubRequest(/.*/, {
        status: 200,
        response: {}
      });

      try {
        await configuredApi.deleteUser(123, "test-token");
      } catch (e) {
        expect(e).toEqual(
          new Error("Invalid response for successful status code: {}")
        );
      }
    });

    it("can handle unsuccessful request with status 403", async () => {
      const expected = {
        message: "error happens",
        signedInAs: "user 1"
      };
      moxios.stubRequest(/.*/, {
        status: 403,
        response: expected
      });

      const response = await configuredApi.deleteUser(123, "test-token");
      expect(response.kind).toBe("forbidden");
      expect(response.data).toStrictEqual(expected);
    });

    it("throw error when unsuccessful request with status 403 with wrong response schema", async () => {
      const expected = {
        message: "error happens"
      };
      moxios.stubRequest(/.*/, {
        status: 403,
        response: expected
      });

      try {
        await configuredApi.deleteUser(123, "test-token");
      } catch (e) {
        expect(e).toEqual(
          new Error(
            `Invalid response for status code 403: ${JSON.stringify(
              expected,
              null,
              2
            )}`
          )
        );
      }
    });
  });
});
