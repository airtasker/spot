import { Config, QueryParam } from "../../definitions";
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
import { queryParamToQueryParameterObject } from "./openapi2-parameter-util";

describe("OpenAPI 2 parameter util: query param", () => {
  const ampersandConfig: Config = {
    paramSerializationStrategy: {
      query: {
        array: "ampersand"
      }
    }
  };
  const commaConfig: Config = {
    paramSerializationStrategy: {
      query: {
        array: "comma"
      }
    }
  };

  describe("Optionality", () => {
    test("Optional param", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: stringType(),
        optional: true
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: false,
        type: "string"
      });
    });

    test("Required param", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: stringType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string"
      });
    });
  });

  describe("Types", () => {
    test("Null type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: nullType(),
        optional: false
      };
      expect(() =>
        queryParamToQueryParameterObject(
          queryParam,
          new TypeTable(),
          ampersandConfig
        )
      ).toThrow("Null is not supported for parameters in OpenAPI 2");
    });

    test("Boolean type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: booleanType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "boolean"
      });
    });

    test("Boolean literal type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: booleanLiteralType(true),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "boolean",
        enum: [true]
      });
    });

    test("String type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: stringType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string"
      });
    });

    test("String literal type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: stringLiteralType("value"),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string",
        enum: ["value"]
      });
    });

    test("Float type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: floatType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "number",
        format: "float"
      });
    });

    test("Double type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: doubleType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "number",
        format: "double"
      });
    });

    test("Float literal type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: floatLiteralType(0.4),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "number",
        format: "float",
        enum: [0.4]
      });
    });

    test("Int32 type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: int32Type(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "integer",
        format: "int32"
      });
    });

    test("Int64 type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: int64Type(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "integer",
        format: "int64"
      });
    });

    test("Int literal type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: intLiteralType(4),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "integer",
        format: "int32",
        enum: [4]
      });
    });

    test("Date type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: dateType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string",
        format: "date"
      });
    });

    test("Date time type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: dateTimeType(),
        optional: false
      };
      const result = queryParamToQueryParameterObject(
        queryParam,
        new TypeTable(),
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string",
        format: "date-time"
      });
    });

    test("Object type", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: objectType([]),
        optional: false
      };
      expect(() =>
        queryParamToQueryParameterObject(
          queryParam,
          new TypeTable(),
          ampersandConfig
        )
      ).toThrow("Object is not supported for parameters in OpenAPI 2");
    });

    test("Reference types are deferenced", () => {
      const queryParam: QueryParam = {
        name: "param",
        type: referenceType("CustomType"),
        optional: false
      };
      const typeTable = new TypeTable();
      typeTable.add("CustomType", { type: stringType() });

      const result = queryParamToQueryParameterObject(
        queryParam,
        typeTable,
        ampersandConfig
      );
      expect(result).toEqual({
        name: "param",
        in: "query",
        required: true,
        type: "string"
      });
    });

    describe("Array type", () => {
      test("Ampersand serialization strategy", () => {
        const queryParam: QueryParam = {
          name: "param",
          type: arrayType(stringType()),
          optional: false
        };
        const result = queryParamToQueryParameterObject(
          queryParam,
          new TypeTable(),
          ampersandConfig
        );
        expect(result).toEqual({
          name: "param",
          in: "query",
          required: true,
          type: "array",
          items: {
            type: "string"
          },
          collectionFormat: "multi"
        });
      });

      test("Comma serialization strategy", () => {
        const queryParam: QueryParam = {
          name: "param",
          type: arrayType(stringType()),
          optional: false
        };
        const result = queryParamToQueryParameterObject(
          queryParam,
          new TypeTable(),
          commaConfig
        );
        expect(result).toEqual({
          name: "param",
          in: "query",
          required: true,
          type: "array",
          items: {
            type: "string"
          },
          collectionFormat: "csv"
        });
      });
    });

    describe("Union type", () => {
      test("Single type and null", () => {
        const queryParam: QueryParam = {
          name: "param",
          type: unionType([stringType(), nullType()]),
          optional: false
        };
        expect(() =>
          queryParamToQueryParameterObject(
            queryParam,
            new TypeTable(),
            ampersandConfig
          )
        ).toThrow("Unions are not supported for parameters in OpenAPI 2");
      });

      test("Multiple non-null types", () => {
        const queryParam: QueryParam = {
          name: "param",
          type: unionType([stringType(), booleanType()]),
          optional: false
        };
        expect(() =>
          queryParamToQueryParameterObject(
            queryParam,
            new TypeTable(),
            ampersandConfig
          )
        ).toThrow("Unions are not supported for parameters in OpenAPI 2");
      });
    });
  });
});
