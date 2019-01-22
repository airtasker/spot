import {
  arrayType,
  BOOLEAN,
  booleanConstant,
  DATE,
  DATETIME,
  DOUBLE,
  FLOAT,
  INT32,
  INT64,
  integerConstant,
  NULL,
  NUMBER,
  objectType,
  optionalType,
  STRING,
  stringConstant,
  typeReference,
  unionType,
  VOID
} from "../models";
import { generateData } from "./dummy";

describe("Dummy", () => {
  describe("generateData", () => {
    test("void", () => {
      expect(generateData({}, VOID)).toBe(undefined);
    });
    test("null", () => {
      expect(generateData({}, NULL)).toBe(null);
    });
    test("boolean", () => {
      expect(typeof generateData({}, BOOLEAN)).toBe("boolean");
    });
    test("boolean-constant", () => {
      expect(generateData({}, booleanConstant(true))).toBe(true);
      expect(generateData({}, booleanConstant(false))).toBe(false);
    });
    test("string", () => {
      expect(typeof generateData({}, STRING)).toBe("string");
    });
    test("string-constant", () => {
      expect(generateData({}, stringConstant("abc"))).toBe("abc");
    });
    test("number", () => {
      expect(typeof generateData({}, NUMBER)).toBe("number");
      expect(decimalPart(generateData({}, NUMBER))).toBe(0);
    });
    test("int32", () => {
      expect(typeof generateData({}, INT32)).toBe("number");
      expect(decimalPart(generateData({}, INT32))).toBe(0);
    });
    test("int64", () => {
      expect(typeof generateData({}, INT64)).toBe("number");
      expect(decimalPart(generateData({}, INT64))).toBe(0);
    });
    test("float", () => {
      expect(typeof generateData({}, FLOAT)).toBe("number");
    });
    test("double", () => {
      expect(typeof generateData({}, DOUBLE)).toBe("number");
    });
    test("date", () => {
      expect(typeof generateData({}, DATE)).toBe("string");
    });
    test("date-time", () => {
      expect(typeof generateData({}, DATETIME)).toBe("string");
    });
    test("integer-constant", () => {
      expect(generateData({}, integerConstant(123))).toBe(123);
    });
    test("object", () => {
      expect(generateData({}, objectType({}))).toEqual({});
      const object = generateData(
        {},
        objectType({
          name: STRING
        })
      );
      expect(typeof object.name).toBe("string");
    });
    test("array", () => {
      let array: string[] = [];
      // Yep, this is scary.
      while (array.length === 0) {
        array = generateData({}, arrayType(STRING));
      }
      expect(array instanceof Array).toBe(true);
      expect(typeof array[0]).toBe("string");
    });
    test("optional", () => {
      let optional: string | undefined = undefined;
      // Yep, this is scary.
      while (!optional) {
        optional = generateData({}, optionalType(STRING));
      }
      expect(typeof optional).toBe("string");
    });
    test("union", () => {
      expect(generateData({}, unionType(stringConstant("abc")))).toBe("abc");
    });
    test("type-reference", () => {
      expect(
        generateData(
          {
            other: stringConstant("other constant")
          },
          typeReference("other")
        )
      ).toBe("other constant");
    });
  });
});

function decimalPart(n: number) {
  return n - Math.floor(n);
}
