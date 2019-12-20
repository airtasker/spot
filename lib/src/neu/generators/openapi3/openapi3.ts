import assertNever from "assert-never";
import {
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  HttpMethod,
  Response
} from "../../definitions";
import {
  isNullType,
  possibleRootTypes,
  Type,
  TypeKind,
  TypeTable
} from "../../types";
import {
  HeaderObject,
  ObjectPropertiesSchemaObject,
  OpenApiV3,
  OperationObject,
  PathsObject,
  ReferenceObject,
  ResponsesObject,
  SchemaObject
} from "./openapi3-schema";

function generateOpenAPI3(contract: Contract): OpenApiV3 {
  const typeTable = TypeTable.fromArray(contract.types);
  const openapi: OpenApiV3 = {
    openapi: "3.0.2",
    info: {
      title: contract.name,
      description: contract.description,
      version: "0.0.0"
    },
    paths: endpointsToPathsObject(contract.endpoints, typeTable)
  };

  return openapi;
}

function endpointsToPathsObject(
  endpoints: Endpoint[],
  typeTable: TypeTable
): PathsObject {
  return endpoints.reduce<PathsObject>((acc, endpoint) => {
    acc[endpoint.path] = acc[endpoint.path] || {};
    const pathItemMethod = httpMethodToPathItemMethod(endpoint.method);
    acc[endpoint.path][pathItemMethod] = endpointToOperationObject(
      endpoint,
      typeTable
    );
    return acc;
  }, {});
}

function endpointToOperationObject(
  endpoint: Endpoint,
  typeTable: TypeTable
): OperationObject {
  return {
    tags: endpoint.tags,
    description: endpoint.description,
    operationId: endpoint.name,
    parameters: [],
    // requestBody:
    responses: endpointResponsesToResponsesObject(
      {
        specific: endpoint.responses,
        default: endpoint.defaultResponse
      },
      typeTable
    )
  };
}

function endpointResponsesToResponsesObject(
  responses: {
    specific: Response[];
    default?: DefaultResponse;
  },
  typeTable: TypeTable
): ResponsesObject {
  const specificResponses = responses.specific.reduce<ResponsesObject>(
    (acc, response) => {
      acc[response.status.toString()] = {
        description: response.description || `${response.status} response`
      };
      return acc;
    },
    {}
  );

  return {};
}

function headerToHeaderObject(
  header: Header,
  typeTable: TypeTable
): HeaderObject {
  return {
    description: header.description,
    required: !header.optional,
    schema: typeToSchemaOrReferenceObject(header.type, typeTable)
  };
}

function typeToSchemaOrReferenceObject(
  type: Type,
  typeTable: TypeTable
): SchemaObject | ReferenceObject {
  switch (type.kind) {
    case TypeKind.NULL:
      throw new Error("unexpected error");
    case TypeKind.BOOLEAN:
      return { type: "boolean" };
    case TypeKind.BOOLEAN_LITERAL:
      return { type: "boolean", enum: [type.value] };
    case TypeKind.STRING:
      return { type: "string" };
    case TypeKind.STRING_LITERAL:
      return { type: "string", enum: [type.value] };
    case TypeKind.FLOAT:
      return { type: "number", format: "float" };
    case TypeKind.DOUBLE:
      return { type: "number", format: "double" };
    case TypeKind.FLOAT_LITERAL:
      return { type: "number", enum: [type.value] };
    case TypeKind.INT32:
      return { type: "integer", format: "int32" };
    case TypeKind.INT64:
      return { type: "integer", format: "int64" };
    case TypeKind.INT_LITERAL:
      return { type: "integer", enum: [type.value] };
    case TypeKind.DATE:
      return { type: "string", format: "date" };
    case TypeKind.DATE_TIME:
      return { type: "string", format: "date-time" };
    case TypeKind.OBJECT:
      return {
        type: "object",
        properties:
          type.properties.length > 0
            ? type.properties.reduce<ObjectPropertiesSchemaObject>(
                (acc, property) => {
                  acc[property.name] = typeToSchemaOrReferenceObject(
                    property.type,
                    typeTable
                  );
                  return acc;
                },
                {}
              )
            : undefined
      };
    case TypeKind.ARRAY:
      return {
        type: "array",
        items: typeToSchemaOrReferenceObject(type.elementType, typeTable)
      };
    case TypeKind.UNION:
      // Check if true union
      const concreteNonNullTypes = possibleRootTypes(
        type,
        typeTable
      ).filter(t => isNullType(t));
      // const isRealUnion = concreteNonNullTypes.length > 1;
      return {
        oneOf: []
      };
    case TypeKind.REFERENCE:
      return {
        $ref: `#/components/schemas/${type.name}`
      };
    default:
      assertNever(type);
  }
}

function httpMethodToPathItemMethod(
  method: HttpMethod
): "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace" {
  switch (method) {
    case "GET":
      return "get";
    case "PUT":
      return "put";
    case "POST":
      return "post";
    case "DELETE":
      return "delete";
    case "PATCH":
      return "patch";
    default:
      assertNever(method);
  }
}
