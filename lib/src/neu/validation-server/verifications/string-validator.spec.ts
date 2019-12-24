import {
  arrayType,
  booleanType,
  floatType,
  int64Type,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  TypeTable,
  unionType
} from "../../types";
import { StringValidator } from "./string-validator";

describe("validators", () => {
  let validator: StringValidator;

  beforeEach(() => {
    const typeTable = new TypeTable();
    typeTable.add(
      "obj1",
      objectType([{ name: "id", type: int64Type(), optional: false }])
    );
    validator = new StringValidator(typeTable);
  });

  describe("valid inputs", () => {
    test("should return true when a primitive value is valid", () => {
      const result = validator.run(
        { name: "param", value: "true" },
        booleanType()
      );
      expect(result).toBe(true);
      expect(validator.messages.length).toEqual(0);
    });

    test("should return true when a array of primitives is valid", () => {
      const result = validator.run(
        { name: "param", value: ["1", "2", "3"] },
        arrayType(int64Type())
      );
      expect(result).toBe(true);
    });

    test("should return true when an object is valid", () => {
      const result = validator.run(
        { name: "param", value: { id: "0", name: "test" } },
        objectType([
          { name: "id", type: int64Type(), optional: false },
          { name: "name", type: stringType(), optional: false }
        ])
      );
      expect(result).toBe(true);
      expect(validator.messages.length).toEqual(0);
    });

    test("should return true when value matches a reference type", () => {
      const result = validator.run(
        { name: "param", value: { id: "10", name: "test" } },
        referenceType("obj1")
      );
      expect(result).toBe(true);
      expect(validator.messages.length).toEqual(0);
    });

    test("should return true for an empty string matching string", () => {
      const result = validator.run({ name: "param", value: "" }, stringType());
      expect(result).toBe(true);
      expect(validator.messages.length).toEqual(0);
    });

    test("should return true when value matches a union type", () => {
      const result = validator.run(
        { name: "param", value: "unionElementA" },
        unionType([
          stringLiteralType("unionElementA"),
          stringLiteralType("unionElementB")
        ])
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

    test("should return an error when value doesn't match a reference type", () => {
      const result = validator.run(
        { name: "param", value: { id: "false", name: "" } },
        referenceType("obj1")
      );
      expect(result).toBe(false);
      expect(validator.messages[0]).toEqual('".param.id" should be int64');
    });

    test("should return an error value doesn't match a union type", () => {
      const result = validator.run(
        { name: "param", value: "unknownElement" },
        unionType([
          stringLiteralType("unionElementA"),
          stringLiteralType("unionElementB")
        ])
      );
      expect(result).toBe(false);
      expect(validator.messages[0]).toEqual(
        '"param" should be a member of a union'
      );
    });
  });
});
