import {
  validateCreateUser_headerAuthToken,
  validateCreateUser_request,
  validateCreateUser_response,
  validateDeleteUser_genericError,
  validateDeleteUser_headerAuthToken,
  validateDeleteUser_specificErrorForbidden,
  validateFindUsers_paramLimit,
  validateFindUsers_paramSearch_term,
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
      it("returns true for header that is present", () => {
        expect(validateCreateUser_headerAuthToken("token")).toBeTruthy();
      });

      it("returns true for header that is not present", () => {
        expect(validateCreateUser_headerAuthToken(undefined)).toBeTruthy();
      });

      it("returns false for header with wrong type", () => {
        expect(validateCreateUser_headerAuthToken(1234)).toBeFalsy();
      });
    });

    describe("required header", () => {
      it("returns true for header that is present", () => {
        expect(validateDeleteUser_headerAuthToken("token")).toBeTruthy();
      });

      it("returns false for header that is not present", () => {
        expect(validateDeleteUser_headerAuthToken(undefined)).toBeFalsy();
      });

      it("returns false for header with wrong type", () => {
        expect(validateDeleteUser_headerAuthToken(1234)).toBeFalsy();
      });
    });
  });

  describe("path param", () => {
    it("returns true for path param that is present", () => {
      expect(validateGetUser_paramUserId(1)).toBeTruthy();
    });

    it("returns false for path param that is not present", () => {
      expect(validateGetUser_paramUserId(undefined)).toBeFalsy();
    });

    it("returns false for path param with wrong type", () => {
      expect(validateGetUser_paramUserId("1")).toBeFalsy();
    });
  });

  describe("query param", () => {
    describe("optional query param", () => {
      it("returns true for query param that is present", () => {
        expect(validateFindUsers_paramSearch_term("user")).toBeTruthy();
      });

      it("returns false for query param that is not present", () => {
        expect(validateFindUsers_paramSearch_term(undefined)).toBeTruthy();
      });

      it("returns false for query param with wrong type", () => {
        expect(validateFindUsers_paramSearch_term(10)).toBeFalsy();
      });
    });

    describe("required query param", () => {
      it("returns true for query param that is present", () => {
        expect(validateFindUsers_paramLimit(10)).toBeTruthy();
      });

      it("returns false for query param that is not present", () => {
        expect(validateFindUsers_paramLimit(undefined)).toBeFalsy();
      });

      it("returns false for query param with wrong type", () => {
        expect(validateFindUsers_paramLimit("10")).toBeFalsy();
      });
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
