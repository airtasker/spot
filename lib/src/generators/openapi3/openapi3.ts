import assertNever from "assert-never";
import {
  Body,
  Config,
  Contract,
  DefaultResponse,
  Endpoint,
  Header,
  HttpMethod,
  isSpecificResponse,
  Request,
  Response
} from "../../definitions";
import {
  isArrayType,
  isNotNullType,
  isObjectType,
  possibleRootTypes,
  Type,
  TypeTable
} from "../../types";
import { KeyOfType } from "../../util";
import {
  ComponentsObject,
  HeaderObject,
  HeaderParameterObject,
  OpenApiV3,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathParameterObject,
  PathsObject,
  QueryParameterObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject
} from "./openapi3-specification";
import { typeToSchemaOrReferenceObject } from "./openapi3-type-util";

const SECURITY_HEADER_SCHEME_NAME = "SecurityHeader";

export function generateOpenAPI3(contract: Contract): OpenApiV3 {
  const typeTable = TypeTable.fromArray(contract.types);
  const openapi: OpenApiV3 = {
    openapi: "3.0.2",
    info: {
      title: contract.name,
      description: contract.description,
      version: "0.0.0"
    },
    paths: endpointsToPathsObject(
      contract.endpoints,
      typeTable,
      contract.config
    ),
    components: contractToComponentsObject(contract, typeTable),
    security: contract.security && [
      {
        [SECURITY_HEADER_SCHEME_NAME]: []
      }
    ]
  };

  return openapi;
}

function contractToComponentsObject(
  contract: Contract,
  typeTable: TypeTable
): ComponentsObject | undefined {
  if (contract.types.length === 0 && contract.security === undefined) {
    return undefined;
  }

  return {
    schemas:
      contract.types.length > 0
        ? contractTypesToComponentsObjectSchemas(contract.types, typeTable)
        : undefined,
    securitySchemes: contract.security && {
      [SECURITY_HEADER_SCHEME_NAME]: {
        type: "apiKey",
        in: "header",
        name: contract.security.name,
        description: contract.security.description
      }
    }
  };
}

function endpointsToPathsObject(
  endpoints: Endpoint[],
  typeTable: TypeTable,
  config: Config
): PathsObject {
  return endpoints.reduce<PathsObject>((acc, endpoint) => {
    const pathName = endpoint.path
      .split("/")
      .map(component =>
        component.startsWith(":") ? `{${component.slice(1)}}` : component
      )
      .join("/");

    acc[pathName] = acc[pathName] ?? {};
    const pathItemMethod = httpMethodToPathItemMethod(endpoint.method);
    acc[pathName][pathItemMethod] = endpointToOperationObject(
      endpoint,
      typeTable,
      config
    );
    return acc;
  }, {});
}

function endpointToOperationObject(
  endpoint: Endpoint,
  typeTable: TypeTable,
  config: Config
): OperationObject {
  const endpointRequest = endpoint.request;
  const endpointRequestBody = endpointRequest?.body;

  return {
    tags: endpoint.tags.length > 0 ? endpoint.tags : undefined,
    description: endpoint.description,
    operationId: endpoint.name,
    parameters:
      endpointRequest &&
      endpointRequestToParameterObjects(endpointRequest, typeTable, config),
    requestBody:
      endpointRequestBody &&
      endpointRequestBodyToRequestBodyObject(endpointRequestBody, typeTable),
    responses: endpointResponsesToResponsesObject(
      {
        specific: endpoint.responses,
        default: endpoint.defaultResponse
      },
      typeTable
    )
  };
}

function endpointRequestToParameterObjects(
  request: Request,
  typeTable: TypeTable,
  config: Config
): ParameterObject[] {
  const pathParameters: PathParameterObject[] = request.pathParams.map(p => ({
    name: p.name,
    in: "path",
    description: p.description,
    required: true,
    schema: typeToSchemaOrReferenceObject(p.type, typeTable)
  }));

  const queryParameters: QueryParameterObject[] = request.queryParams.map(
    p => ({
      name: p.name,
      in: "query",
      description: p.description,
      ...typeToQueryParameterSerializationStrategy(p.type, typeTable, config),
      required: !p.optional,
      schema: typeToSchemaOrReferenceObject(p.type, typeTable)
    })
  );

  const headerParameters: HeaderParameterObject[] = request.headers.map(p => ({
    name: p.name,
    in: "header",
    description: p.description,
    required: !p.optional,
    schema: typeToSchemaOrReferenceObject(p.type, typeTable)
  }));

  const parameters: ParameterObject[] = [];

  return parameters.concat(pathParameters, queryParameters, headerParameters);
}

function typeToQueryParameterSerializationStrategy(
  type: Type,
  typeTable: TypeTable,
  config: Config
): Pick<QueryParameterObject, "style" | "explode"> {
  const possibleTypes = possibleRootTypes(type, typeTable).filter(
    isNotNullType
  );

  if (possibleTypes.length === 0) {
    throw new Error("Unexpected error: query param resolved to no types");
  }

  // Style is ambigious for a union containing both object and array types
  // TODO: warn
  const possiblyObjectType = possibleTypes.some(isObjectType);
  const possiblyArrayType = possibleTypes.some(isArrayType);

  if (possiblyObjectType && !possiblyArrayType) {
    return { style: "deepObject", explode: true };
  }

  if (possiblyArrayType && !possiblyObjectType) {
    switch (config.paramSerializationStrategy.query.array) {
      case "ampersand": {
        return { style: "form", explode: true };
      }
      case "comma": {
        return { style: "form", explode: false };
      }
      default:
        assertNever(config.paramSerializationStrategy.query.array);
    }
  }

  return {};
}

function endpointRequestBodyToRequestBodyObject(
  requestBody: Body,
  typeTable: TypeTable
): RequestBodyObject {
  const content = {
    "application/json": {
      schema: typeToSchemaOrReferenceObject(requestBody.type, typeTable)
    }
  };

  // TODO: currently Spot does not support optional request body
  return { content, required: true };
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
    response.description ??
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

  const content = response.body && {
    "application/json": {
      schema: typeToSchemaOrReferenceObject(response.body.type, typeTable)
    }
  };

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

function contractTypesToComponentsObjectSchemas(
  types: Contract["types"],
  typeTable: TypeTable
): ComponentsObject["schemas"] {
  return types.reduce<Required<ComponentsObject>["schemas"]>((acc, t) => {
    acc[t.name] = typeToSchemaOrReferenceObject(t.type, typeTable);
    return acc;
  }, {});
}

function httpMethodToPathItemMethod(
  method: HttpMethod
): KeyOfType<PathItemObject, OperationObject> {
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
