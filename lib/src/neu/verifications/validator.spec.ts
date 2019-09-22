import {
  arrayType,
  booleanType,
  floatType,
  int64Type,
  objectType,
  stringType
} from "../types";
import { Validator } from "./validator";

describe("validators", () => {
  let validator: Validator;
  beforeEach(() => {
    validator = new Validator();
  });

  describe("valid inputs", () => {
    test("should return true when a primitive value is value", () => {
      const result = validator.run(
        { name: "param", value: "true" },
        booleanType()
      );
      expect(result).toBe(true);
      expect(validator.messages.length).toEqual(0);
    });
  });

  describe("invalid inputs", () => {
    test("should return an error when a primitive value is invalid", () => {
      const result = validator.run(
        { name: "param", value: "notANumber" },
        floatType()
      );
      expect(result).toBe(false);
      expect(validator.messages[0]).toEqual('"param" should be float');
    });

    test("should return an error when a array of primitives is invalid", () => {
      const result = validator.run(
        { name: "param", value: ["1", "notANumber", "3"] },
        arrayType(int64Type())
      );
      expect(result).toBe(false);
      expect(validator.messages[0]).toEqual('"param[1]" should be int64');
    });

    test("should return an error when an object is invalid", () => {
      const result = validator.run(
        { name: "param", value: { id: "false", name: "" } },
        objectType([
          { name: "id", type: int64Type(), optional: false },
          { name: "name", type: stringType(), optional: false }
        ])
      );
      expect(result).toBe(false);
      expect(validator.messages[0]).toEqual('".param.id" should be int64');
    });
  });
});
