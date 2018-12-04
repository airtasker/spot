import { createUser } from "./sdk/client";
import * as moxios from "moxios";
import { CreateUserResponse } from "./sdk/types";

describe("TypeScript axios client sdk test", () => {
  beforeEach(() => {
    // import and pass your custom axios instance to this method
    moxios.install();
  });

  afterEach(() => {
    // import and pass your custom axios instance to this method
    moxios.uninstall();
  });

  describe("POST request", () => {
    it("returns success", async () => {
      const expectedResponse: CreateUserResponse = {
        success: true,
        created_at: "2018-01-01"
      };

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

    it("returns error", async () => {
      moxios.stubRequest("/users/create", {
        status: 400,
        response: undefined
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
