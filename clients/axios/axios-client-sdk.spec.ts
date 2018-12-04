import { createUser } from "./sdk/client";
import * as moxios from "moxios";
import { CreateUserResponse } from "./sdk/types";

const expectedResponse: CreateUserResponse = {
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

  describe("POST request", () => {
    it("passes the correct method and request body", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: expectedResponse
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
        response: expectedResponse
      });

      await createUser({ name: "User 1", roles: "admin" }, "test-token");

      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBe("test-token");
    });

    it("allows undefined header", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: expectedResponse
      });

      await createUser({ name: "User 1", roles: "admin" }, undefined);
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toBe("post");
      expect(request.config.headers["Authorization"]).toBeUndefined();
    });

    it("can handle successful request", async () => {
      moxios.stubRequest("/users/create", {
        status: 200,
        response: expectedResponse
      });

      const response = await createUser(
        { name: "User 1", roles: "admin" },
        "test-token"
      );
      expect(response.kind).toBe("success");
      expect(response.data).toEqual(expectedResponse);
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
});
