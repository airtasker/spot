import {
  arrayType,
  BOOLEAN,
  booleanLiteral,
  DATE,
  DATETIME,
  FLOAT,
  INT32,
  NULL,
  numberLiteral,
  objectType,
  referenceType,
  STRING,
  stringLiteral,
  TypeKind,
  unionType
} from "../models/types";
import { generateData } from "./dummy";

describe("Dummy", () => {
  describe("generateData", () => {
    test("null", () => {
      expect(generateData([], NULL)).toBe(null);
    });
    test("boolean", () => {
      expect(typeof generateData([], BOOLEAN)).toBe("boolean");
    });
    test("boolean literal", () => {
      expect(generateData([], booleanLiteral(true))).toBe(true);
      expect(generateData([], booleanLiteral(false))).toBe(false);
    });
    test("string", () => {
      expect(typeof generateData([], STRING)).toBe("string");
    });
    test("string literal", () => {
      expect(generateData([], stringLiteral("abc"))).toBe("abc");
    });
    test("float", () => {
      expect(typeof generateData([], FLOAT)).toBe("number");
    });
    test("int32", () => {
      expect(typeof generateData([], INT32)).toBe("number");
      expect(decimalPart(generateData([], INT32))).toBe(0);
    });
    test("date", () => {
      expect(typeof generateData([], DATE)).toBe("string");
    });
    test("date-time", () => {
      expect(typeof generateData([], DATETIME)).toBe("string");
    });
    test("number literal", () => {
      expect(generateData([], numberLiteral(123))).toBe(123);
      expect(generateData([], numberLiteral(-0.123))).toBe(-0.123);
    });
    test("object", () => {
      expect(generateData([], objectType([]))).toEqual({});
      const object = generateData(
        [],
        objectType([
          {
            name: "name",
            type: STRING,
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
        array = generateData([], arrayType(STRING));
      }
      expect(array instanceof Array).toBe(true);
      expect(typeof array[0]).toBe("string");
    });
    test("union", () => {
      expect(generateData([], unionType([stringLiteral("abc")]))).toBe("abc");
    });
    test("type reference", () => {
      expect(
        generateData(
          [
            {
              name: "other",
              type: stringLiteral("other constant")
            }
          ],
          referenceType("other", "location", TypeKind.STRING)
        )
      ).toBe("other constant");
    });
  });
});

function decimalPart(n: number) {
  return n - Math.floor(n);
}
