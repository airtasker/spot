import {
  validateCreateUser_headerAuthToken,
  validateCreateUser_request,
  validateCreateUser_response,
  validateDeleteUser_genericError,
  validateDeleteUser_headerAuthToken,
  validateDeleteUser_specificErrorForbidden,
  validateFindUsers_response,
  validateGetUser_paramUserId
} from "./sdk/validators";

describe("validators test", () => {
  describe("request", () => {
    it("returns true for valid request", () => {
      expect(
        validateCreateUser_request({
          name: "first_name",
          roles: "admin"
        })
      ).toBeTruthy();
    });

    it("returns false for invalid request", () => {
      expect(
        validateCreateUser_request({
          name: "first_name",
          roles: "non a role"
        })
      ).toBeFalsy();
    });

    it("returns false for empty value", () => {
      expect(validateCreateUser_request(null)).toBeFalsy();
    });
  });

  describe("header", () => {
    describe("optional header", () => {
      it("returns true for header that present", () => {
        expect(validateCreateUser_headerAuthToken("token")).toBeTruthy();
      });

      it("returns true for header that is not present", () => {
        expect(validateCreateUser_headerAuthToken(undefined)).toBeTruthy();
      });
    });

    describe("required header", () => {
      it("returns true for header that present", () => {
        expect(validateDeleteUser_headerAuthToken("token")).toBeTruthy();
      });

      it("returns false for header that is not present", () => {
        expect(validateDeleteUser_headerAuthToken(undefined)).toBeFalsy();
      });
    });
  });

  describe("path param", () => {
    it("returns true for path param that present", () => {
      expect(validateGetUser_paramUserId(1)).toBeTruthy();
    });

    it("returns false for path param that is not present", () => {
      expect(validateGetUser_paramUserId(undefined)).toBeFalsy();
    });

    it("returns false for path param with wrong type", () => {
      expect(validateGetUser_paramUserId("1")).toBeFalsy();
    });
  });

  describe("response", () => {
    describe("non array response", () => {
      it("returns true for valid response", () => {
        expect(
          validateCreateUser_response({
            success: true,
            created_at: "2018-01-01"
          })
        ).toBeTruthy();
      });

      it("returns false for invalid response", () => {
        expect(
          validateCreateUser_response({
            success: "true",
            created_at: "2018-01-01"
          })
        ).toBeFalsy();
      });
    });

    describe("array response", () => {
      it("returns true for valid response", () => {
        expect(
          validateFindUsers_response([
            {
              name: "user 1",
              age: 55
            }
          ])
        ).toBeTruthy();
      });

      it("returns false for invalid response", () => {
        expect(
          validateFindUsers_response([
            {
              name: "user 1",
              age: 55
            },
            {
              age: 60
            }
          ])
        ).toBeFalsy();
      });
    });
  });

  describe("generic error", () => {
    it("returns true for valid generic error", () => {
      expect(
        validateDeleteUser_genericError({
          message: "internal error"
        })
      ).toBeTruthy();
    });

    it("returns false for invalid generic error", () => {
      expect(
        validateDeleteUser_genericError({
          message: false
        })
      ).toBeFalsy();
    });
  });

  describe("specific error", () => {
    it("returns true for valid specific error", () => {
      expect(
        validateDeleteUser_specificErrorForbidden({
          message: "internal error",
          signedInAs: "user 1"
        })
      ).toBeTruthy();
    });

    it("returns false for invalid specific error", () => {
      expect(
        validateDeleteUser_specificErrorForbidden({
          message: "internal error"
        })
      ).toBeFalsy();
    });
  });
});
