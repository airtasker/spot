import { Header } from "../../definitions";
import {
  arrayType,
  booleanLiteralType,
  booleanType,
  dateTimeType,
  dateType,
  doubleType,
  floatLiteralType,
  floatType,
  int32Type,
  int64Type,
  intLiteralType,
  nullType,
  objectType,
  referenceType,
  stringLiteralType,
  stringType,
  TypeTable,
  unionType
} from "../../types";
import { responseHeaderToHeaderObject } from "./openapi2-parameter-util";

describe("OpenAPI 2 parameter util: response header", () => {
  describe("Optionality", () => {
    test("Optional header has not effect", () => {
      const header: Header = {
        name: "param",
        type: stringType(),
        optional: true
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string"
      });
    });

    test("Required header has no effect", () => {
      const header: Header = {
        name: "param",
        type: stringType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string"
      });
    });
  });

  describe("Types", () => {
    test("Null type", () => {
      const header: Header = {
        name: "param",
        type: nullType(),
        optional: false
      };
      expect(() =>
        responseHeaderToHeaderObject(header, new TypeTable())
      ).toThrowError("Null is not supported for parameters in OpenAPI 2");
    });

    test("Boolean type", () => {
      const header: Header = {
        name: "param",
        type: booleanType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "boolean"
      });
    });

    test("Boolean literal type", () => {
      const header: Header = {
        name: "param",
        type: booleanLiteralType(true),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "boolean",
        enum: [true]
      });
    });

    test("String type", () => {
      const header: Header = {
        name: "param",
        type: stringType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string"
      });
    });

    test("String literal type", () => {
      const header: Header = {
        name: "param",
        type: stringLiteralType("value"),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string",
        enum: ["value"]
      });
    });

    test("Float type", () => {
      const header: Header = {
        name: "param",
        type: floatType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "number",
        format: "float"
      });
    });

    test("Double type", () => {
      const header: Header = {
        name: "param",
        type: doubleType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "number",
        format: "double"
      });
    });

    test("Float literal type", () => {
      const header: Header = {
        name: "param",
        type: floatLiteralType(0.4),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "number",
        format: "float",
        enum: [0.4]
      });
    });

    test("Int32 type", () => {
      const header: Header = {
        name: "param",
        type: int32Type(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "integer",
        format: "int32"
      });
    });

    test("Int64 type", () => {
      const header: Header = {
        name: "param",
        type: int64Type(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "integer",
        format: "int64"
      });
    });

    test("Int literal type", () => {
      const header: Header = {
        name: "param",
        type: intLiteralType(4),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "integer",
        format: "int32",
        enum: [4]
      });
    });

    test("Date type", () => {
      const header: Header = {
        name: "param",
        type: dateType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string",
        format: "date"
      });
    });

    test("Date time type", () => {
      const header: Header = {
        name: "param",
        type: dateTimeType(),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "string",
        format: "date-time"
      });
    });

    test("Object type", () => {
      const header: Header = {
        name: "param",
        type: objectType([]),
        optional: false
      };
      expect(() =>
        responseHeaderToHeaderObject(header, new TypeTable())
      ).toThrowError("Object is not supported for parameters in OpenAPI 2");
    });

    test("Reference types are deferenced", () => {
      const header: Header = {
        name: "param",
        type: referenceType("CustomType"),
        optional: false
      };
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = responseHeaderToHeaderObject(header, typeTable);
      expect(result).toEqual({
        type: "string"
      });
    });

    test("Array type", () => {
      const header: Header = {
        name: "param",
        type: arrayType(stringType()),
        optional: false
      };
      const result = responseHeaderToHeaderObject(header, new TypeTable());
      expect(result).toEqual({
        type: "array",
        items: {
          type: "string"
        }
      });
    });

    describe("Union type", () => {
      test("Single type and null", () => {
        const header: Header = {
          name: "param",
          type: unionType([stringType(), nullType()]),
          optional: false
        };
        expect(() =>
          responseHeaderToHeaderObject(header, new TypeTable())
        ).toThrowError("Unions are not supported for parameters in OpenAPI 2");
      });

      test("Multiple non-null types", () => {
        const header: Header = {
          name: "param",
          type: unionType([stringType(), booleanType()]),
          optional: false
        };
        expect(() =>
          responseHeaderToHeaderObject(header, new TypeTable())
        ).toThrowError("Unions are not supported for parameters in OpenAPI 2");
      });
    });
  });
});
