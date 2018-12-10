import { createUser, deleteUser, findUsers, getUser } from "./sdk/client";
import * as moxios from "moxios";
import { CreateUserResponse } from "./sdk/types";

const createUserResponse: CreateUserResponse = {
  success: true,
  created_at: "2018-01-01"
};

describe("TypeScript axios client sdk test", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  describe("POST createUser", () => {
    it("passes the correct method and request body", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: createUserResponse
      });

      await createUser({ name: "User 1", roles: "admin" }, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(JSON.parse(request.config.data)).toStrictEqual({
        name: "User 1",
        roles: "admin"
      });
    });

    it("passes the correct header", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: createUserResponse
      });

      await createUser({ name: "User 1", roles: "admin" }, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBe("test-token");
    });

    it("allows undefined header", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: createUserResponse
      });

      await createUser({ name: "User 1", roles: "admin" }, undefined);
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBeUndefined();
    });

    it("can handle successful request", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: createUserResponse
      });

      const response = await createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(createUserResponse);
    });

    it("throws error when response is not CreateUserResponse", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: {}
      });

      try {
        await createUser({ name: "User 1", roles: "admin" }, "test-token");
      } catch (e) {
        expect(e).toEqual(
          new Error("Invalid response for successful status code: {}")
        );
      }
    });

    it("can handle unsuccessful request", async () => {
      moxios.stubRequest("/users/create", {
        status: 400
      });

      const response = await createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("GET findUsers", () => {
    it("passes the correct method and queryParams", async () => {
      moxios.stubRequest("/users?limit=10&search_term=user", {
        status: 200,
        response: [
          {
            name: "first_user",
            age: 23
          }
        ]
      });

      await findUsers(10, "user");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("get");
      expect(request.config.url).toContain("/users");
      expect(request.config.params).toStrictEqual({
        limit: 10,
        search_term: "user"
      });
    });

    it("allows optional queryParams", async () => {
      moxios.stubRequest("/users?limit=10", {
        status: 200,
        response: [
          {
            name: "first_user",
            age: 23
          }
        ]
      });

      await findUsers(10, undefined);

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
      moxios.stubRequest("/users?limit=10&search_term=user", {
        status: 200,
        response: expected
      });

      const response = await findUsers(10, "user");
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
      moxios.stubRequest("/users?limit=10&search_term=user", {
        status: 200,
        response: expected
      });

      const response = await findUsers(10, "user");
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("can handle unsuccessful request", async () => {
      moxios.stubRequest("/users?limit=10&search_term=user", {
        status: 400
      });

      const response = await findUsers(10, "user");
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("GET getUser", () => {
    it("passes the correct method and pathParam", async () => {
      moxios.stubRequest("/users/123", {
        status: 200,
        response: {
          name: "first_user",
          age: 23
        }
      });

      await getUser(123);

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("get");
      expect(request.config.url).toContain("/123");
    });

    it("can handle successful request", async () => {
      const expected = {
        name: "first_user",
        age: 23
      };
      moxios.stubRequest("/users/123", {
        status: 200,
        response: expected
      });

      const response = await getUser(123);
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("can handle successful request with optional response", async () => {
      const expected = {
        name: "first_user"
      };
      moxios.stubRequest("/users/123", {
        status: 200,
        response: expected
      });

      const response = await getUser(123);
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expected);
    });

    it("throws error when response schema is not correct", async () => {
      const response = {
        name: "first_user",
        age: "23"
      };

      moxios.stubRequest("/users/123", {
        status: 200,
        response: response
      });

      try {
        await getUser(123);
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
      moxios.stubRequest("/users/123", {
        status: 400
      });

      const response = await getUser(123);
      expect(response.kind).toBe("unknown-error");
      expect(response.data).toBeUndefined();
    });
  });

  describe("DELETE deleteUser", () => {
    it("passes the correct method and pathParam", async () => {
      moxios.stubRequest("/users/123-confirmed", {
        status: 200,
        response: null
      });

      await deleteUser(123, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("delete");
      expect(request.config.url).toContain("/123-confirmed");
    });

    it("passes the correct header", async () => {
      moxios.stubRequest("/users/123-confirmed", {
        status: 200,
        response: null
      });

      await deleteUser(123, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.headers["Authorization"]).toBe("test-token");
    });

    it("can handle successful request", async () => {
      moxios.stubRequest("/users/123-confirmed", {
        status: 200,
        response: null
      });

      const response = await deleteUser(123, "test-token");
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(null);
    });

    it("throws error when response schema is not correct", async () => {
      moxios.stubRequest("/users/123-confirmed", {
        status: 200,
        response: {}
      });

      try {
        await deleteUser(123, "test-token");
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
      moxios.stubRequest("/users/123-confirmed", {
        status: 403,
        response: expected
      });

      const response = await deleteUser(123, "test-token");
      expect(response.kind).toBe("forbidden");
      expect(response.data).toStrictEqual(expected);
    });

    it("throw error when unsuccessful request with status 403 with wrong response schema", async () => {
      const expected = {
        message: "error happens"
      };
      moxios.stubRequest("/users/123-confirmed", {
        status: 403,
        response: expected
      });

      try {
        await deleteUser(123, "test-token");
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
