import {
  arrayType,
  booleanLiteralType,
  booleanType,
  dateTimeType,
  dateType,
  floatLiteralType,
  floatType,
  int32Type,
  intLiteralType,
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  TypeTable,
  unionType
} from "../types";
import { generateData } from "./dummy";

describe("Dummy", () => {
  describe("generateData", () => {
    test("null", () => {
      expect(generateData(new TypeTable(), nullType())).toBe(null);
    });
    test("boolean", () => {
      expect(typeof generateData(new TypeTable(), booleanType())).toBe(
        "boolean"
      );
    });
    test("boolean literal", () => {
      expect(generateData(new TypeTable(), booleanLiteralType(true))).toBe(
        true
      );
      expect(generateData(new TypeTable(), booleanLiteralType(false))).toBe(
        false
      );
    });
    test("string", () => {
      expect(typeof generateData(new TypeTable(), stringType())).toBe("string");
    });
    test("string literal", () => {
      expect(generateData(new TypeTable(), stringLiteralType("abc"))).toBe(
        "abc"
      );
    });
    test("float", () => {
      expect(typeof generateData(new TypeTable(), floatType())).toBe("number");
    });
    test("int32", () => {
      expect(typeof generateData(new TypeTable(), int32Type())).toBe("number");
      expect(decimalPart(generateData(new TypeTable(), int32Type()))).toBe(0);
    });
    test("date", () => {
      expect(typeof generateData(new TypeTable(), dateType())).toBe("string");
    });
    test("date-time", () => {
      expect(typeof generateData(new TypeTable(), dateTimeType())).toBe(
        "string"
      );
    });
    test("number literal", () => {
      expect(generateData(new TypeTable(), intLiteralType(123))).toBe(123);
      expect(generateData(new TypeTable(), floatLiteralType(-0.123))).toBe(
        -0.123
      );
    });
    test("object", () => {
      expect(generateData(new TypeTable(), objectType([]))).toEqual({});
      const object = generateData(
        new TypeTable(),
        objectType([
          {
            name: "name",
            type: stringType(),
            optional: false
          }
        ])
      );
      expect(typeof object.name).toBe("string");
    });
    test("array", () => {
      let array: string[] = [];
      // Yep, this is scary.
      while (array.length === 0) {
        array = generateData(new TypeTable(), arrayType(stringType()));
      }
      expect(array instanceof Array).toBe(true);
      expect(typeof array[0]).toBe("string");
    });
    test("union", () => {
      expect(
        generateData(new TypeTable(), unionType([stringLiteralType("abc")]))
      ).toBe("abc");
    });
    test("type reference", () => {
      const types = new TypeTable();
      types.add("other", { type: stringLiteralType("other constant") });
      expect(generateData(types, referenceType("other"))).toBe(
        "other constant"
      );
    });
  });
});

function decimalPart(n: number) {
  return n - Math.floor(n);
}
