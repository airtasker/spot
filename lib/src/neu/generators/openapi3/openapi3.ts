import assertNever from "assert-never";
import {
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  HttpMethod,
  isSpecificResponse,
  Response
} from "../../definitions";
import { TypeTable } from "../../types";
import {
  HeaderObject,
  OpenApiV3,
  OperationObject,
  PathsObject,
  ResponseObject,
  ResponsesObject
} from "./openapi3-schema";
import { typeToSchemaOrReferenceObject } from "./openapi3-type-util";

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
  const responsesObject = responses.specific.reduce<ResponsesObject>(
    (acc, response) => {
      acc[response.status.toString(10)] = endpointResponseToResponseObject(
        response,
        typeTable
      );
      return acc;
    },
    {}
  );

  if (responses.default) {
    responsesObject.default = endpointResponseToResponseObject(
      responses.default,
      typeTable
    );
  }

  return responsesObject;
}

function endpointResponseToResponseObject(
  response: Response | DefaultResponse,
  typeTable: TypeTable
): ResponseObject {
  const description =
    response.description ||
    (isSpecificResponse(response)
      ? `${response.status} response`
      : "default response");

  const headers =
    response.headers.length > 0
      ? response.headers.reduce<{ [name: string]: HeaderObject }>(
          (acc, header) => {
            acc[header.name] = headerToHeaderObject(header, typeTable);
            return acc;
          },
          {}
        )
      : undefined;

  const content =
    response.body !== undefined
      ? {
          "application/json": {
            schema: typeToSchemaOrReferenceObject(response.body.type, typeTable)
          }
        }
      : undefined;

  return { description, headers, content };
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
