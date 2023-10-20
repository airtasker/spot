import { PathParam } from "../../definitions";
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
import { pathParamToPathParameterObject } from "./openapi2-parameter-util";

describe("OpenAPI 2 parameter util: path param", () => {
  test("Null type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: nullType()
    };
    expect(() =>
      pathParamToPathParameterObject(pathParam, new TypeTable())
    ).toThrow("Null is not supported for parameters in OpenAPI 2");
  });

  test("Boolean type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: booleanType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "boolean"
    });
  });

  test("Boolean literal type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: booleanLiteralType(true)
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "boolean",
      enum: [true]
    });
  });

  test("String type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: stringType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "string"
    });
  });

  test("String literal type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: stringLiteralType("value")
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "string",
      enum: ["value"]
    });
  });

  test("Float type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: floatType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "number",
      format: "float"
    });
  });

  test("Double type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: doubleType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "number",
      format: "double"
    });
  });

  test("Float literal type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: floatLiteralType(0.4)
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "number",
      format: "float",
      enum: [0.4]
    });
  });

  test("Int32 type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: int32Type()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "integer",
      format: "int32"
    });
  });

  test("Int64 type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: int64Type()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "integer",
      format: "int64"
    });
  });

  test("Int literal type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: intLiteralType(4)
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "integer",
      format: "int32",
      enum: [4]
    });
  });

  test("Date type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: dateType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "string",
      format: "date"
    });
  });

  test("Date time type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: dateTimeType()
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "string",
      format: "date-time"
    });
  });

  test("Object type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: objectType([])
    };
    expect(() =>
      pathParamToPathParameterObject(pathParam, new TypeTable())
    ).toThrow("Object is not supported for parameters in OpenAPI 2");
  });

  test("Reference types are deferenced", () => {
    const pathParam: PathParam = {
      name: "param",
      type: referenceType("CustomType")
    };
    const typeTable = new TypeTable();
    typeTable.add("CustomType", { type: stringType() });

    const result = pathParamToPathParameterObject(pathParam, typeTable);
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "string"
    });
  });

  test("Array type", () => {
    const pathParam: PathParam = {
      name: "param",
      type: arrayType(stringType())
    };
    const result = pathParamToPathParameterObject(pathParam, new TypeTable());
    expect(result).toEqual({
      name: "param",
      in: "path",
      required: true,
      type: "array",
      items: {
        type: "string"
      }
    });
  });

  describe("Union type", () => {
    test("Single type and null", () => {
      const pathParam: PathParam = {
        name: "param",
        type: unionType([stringType(), nullType()])
      };
      expect(() =>
        pathParamToPathParameterObject(pathParam, new TypeTable())
      ).toThrow("Unions are not supported for parameters in OpenAPI 2");
    });

    test("Multiple non-null types", () => {
      const pathParam: PathParam = {
        name: "param",
        type: unionType([stringType(), booleanType()])
      };
      expect(() =>
        pathParamToPathParameterObject(pathParam, new TypeTable())
      ).toThrow("Unions are not supported for parameters in OpenAPI 2");
    });
  });
});
