import assertNever from "assert-never";
import { Config, Header, PathParam, QueryParam } from "../../definitions";
import {
  ArrayType,
  dereferenceType,
  isArrayType,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable
} from "../../types";
import {
  ArrayMultiParameterObjectType,
  ArrayParameterObjectType,
  BooleanParameterObjectType,
  HeaderObject,
  HeaderParameterObject,
  IntegerParameterObjectType,
  ItemsObject,
  NumberParameterObjectType,
  PathParameterObject,
  QueryParameterObject,
  StringParameterObject
} from "./openapi2-specification";

export function pathParamToPathParameterObject(
  pathParam: PathParam,
  typeTable: TypeTable
): PathParameterObject {
  const concreteType = dereferenceType(pathParam.type, typeTable);

  return {
    name: pathParam.name,
    in: "path",
    description: pathParam.description,
    required: true,
    ...(isArrayType(concreteType)
      ? pathParamArrayTypeToParameterArrayTypeObject(concreteType, typeTable)
      : basicTypeToParameterBasicTypeObject(concreteType))
  };
}

export function requestHeaderToHeaderParameterObject(
  header: Header,
  typeTable: TypeTable
): HeaderParameterObject {
  const concreteType = dereferenceType(header.type, typeTable);

  return {
    name: header.name,
    in: "header",
    description: header.description,
    required: !header.optional,
    ...(isArrayType(concreteType)
      ? headerArrayTypeToParameterArrayTypeObject(concreteType, typeTable)
      : basicTypeToParameterBasicTypeObject(concreteType))
  };
}

export function queryParamToQueryParameterObject(
  queryParam: QueryParam,
  typeTable: TypeTable,
  config: Config
): QueryParameterObject {
  const concreteType = dereferenceType(queryParam.type, typeTable);

  return {
    name: queryParam.name,
    in: "query",
    description: queryParam.description,
    required: !queryParam.optional,
    ...(isArrayType(concreteType)
      ? queryParamArrayTypeToParameterArrayTypeObject(
          concreteType,
          typeTable,
          config
        )
      : basicTypeToParameterBasicTypeObject(concreteType))
  };
}

export function responseHeaderToHeaderObject(
  header: Header,
  typeTable: TypeTable
): HeaderObject {
  // TODO: warn header optionality is ignored for header object
  return {
    description: header.description,
    ...typeToItemsObject(header.type, typeTable)
  };
}

function basicTypeToParameterBasicTypeObject(
  type: Exclude<Type, ArrayType | ReferenceType>
):
  | StringParameterObject
  | NumberParameterObjectType
  | IntegerParameterObjectType
  | BooleanParameterObjectType {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error("Null is not supported for parameters in OpenAPI 2");
    case TypeKind.BOOLEAN:
      return booleanParameterObject();
    case TypeKind.BOOLEAN_LITERAL:
      return booleanParameterObject({ values: [type.value] });
    case TypeKind.STRING:
      return stringParameterObject();
    case TypeKind.STRING_LITERAL:
      return stringParameterObject({ values: [type.value] });
    case TypeKind.FLOAT:
      return numberParameterObject({ format: "float" });
    case TypeKind.DOUBLE:
      return numberParameterObject({ format: "double" });
    case TypeKind.FLOAT_LITERAL:
      return numberParameterObject({
        values: [type.value],
        format: "float"
      });
    case TypeKind.INT32:
      return integerParameterObject({ format: "int32" });
    case TypeKind.INT64:
      return integerParameterObject({ format: "int64" });
    case TypeKind.INT_LITERAL:
      return integerParameterObject({
        values: [type.value],
        format: "int32"
      });
    case TypeKind.DATE:
      return stringParameterObject({ format: "date" });
    case TypeKind.DATE_TIME:
      return stringParameterObject({ format: "date-time" });
    case TypeKind.OBJECT:
      throw new Error("Object is not supported for parameters in OpenAPI 2");
    case TypeKind.UNION:
      throw new Error("Unions are not supported for parameters in OpenAPI 2");
    case TypeKind.INTERSECTION:
      throw new Error(
        "Intersections are not supported for parameters in OpenAPI 2"
      );
    default:
      assertNever(type);
  }
}

function booleanParameterObject(
  opts: { values?: boolean[] } = {}
): BooleanParameterObjectType {
  return {
    type: "boolean",
    enum: opts.values
  };
}

function stringParameterObject(
  opts: {
    values?: string[];
    format?: StringParameterObject["format"];
  } = {}
): StringParameterObject {
  return {
    type: "string",
    enum: opts.values,
    format: opts.format
  };
}

function numberParameterObject(
  opts: {
    values?: number[];
    format?: NumberParameterObjectType["format"];
  } = {}
): NumberParameterObjectType {
  return {
    type: "number",
    enum: opts.values,
    format: opts.format
  };
}

function integerParameterObject(
  opts: {
    values?: number[];
    format?: IntegerParameterObjectType["format"];
  } = {}
): IntegerParameterObjectType {
  return {
    type: "integer",
    enum: opts.values,
    format: opts.format
  };
}

const pathParamArrayTypeToParameterArrayTypeObject = arrayTypeToParameterArrayTypeObject;
const headerArrayTypeToParameterArrayTypeObject = arrayTypeToParameterArrayTypeObject;
const queryParamArrayTypeToParameterArrayTypeObject = (
  type: ArrayType,
  typeTable: TypeTable,
  config: Config
): ArrayMultiParameterObjectType =>
  arrayTypeToParameterArrayMultiTypeObject(
    type,
    typeTable,
    configToQueryParameterCollectionFormat(config)
  );

function arrayTypeToParameterArrayTypeObject(
  type: ArrayType,
  typeTable: TypeTable,
  collectionFormat?: ArrayParameterObjectType["collectionFormat"]
): ArrayParameterObjectType {
  return {
    type: "array",
    collectionFormat,
    items: typeToItemsObject(type.elementType, typeTable)
  };
}

function arrayTypeToParameterArrayMultiTypeObject(
  type: ArrayType,
  typeTable: TypeTable,
  collectionFormat?: ArrayMultiParameterObjectType["collectionFormat"]
): ArrayMultiParameterObjectType {
  return {
    type: "array",
    collectionFormat,
    items: typeToItemsObject(type.elementType, typeTable)
  };
}

function typeToItemsObject(type: Type, typeTable: TypeTable): ItemsObject {
  const concreteType = dereferenceType(type, typeTable);

  return isArrayType(concreteType)
    ? {
        type: "array",
        items: typeToItemsObject(concreteType.elementType, typeTable)
      }
    : basicTypeToParameterBasicTypeObject(concreteType);
}

function configToQueryParameterCollectionFormat(
  config: Config
): ArrayMultiParameterObjectType["collectionFormat"] {
  switch (config.paramSerializationStrategy.query.array) {
    case "ampersand":
      return "multi";
    case "comma":
      return "csv";
    default:
      assertNever(config.paramSerializationStrategy.query.array);
  }
}
