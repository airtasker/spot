import assertNever from "assert-never";
import {
  Config,
  Contract,
  DefaultResponse,
  Endpoint,
  HttpMethod,
  isSpecificResponse,
  Request,
  Response
} from "../../definitions";
import { TypeTable } from "../../types";
import { KeyOfType } from "../../util";
import {
  pathParamToPathParameterObject,
  queryParamToQueryParameterObject,
  requestHeaderToHeaderParameterObject,
  responseHeaderToHeaderObject
} from "./openapi2-parameter-util";
import {
  BodyParameterObject,
  DefinitionsObject,
  HeaderObject,
  HeaderParameterObject,
  OpenApiV2,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathParameterObject,
  PathsObject,
  QueryParameterObject,
  ResponseObject,
  ResponsesObject,
  SecurityDefinitionsObject
} from "./openapi2-specification";
import { typeToSchemaObject } from "./openapi2-type-util";

const SECURITY_HEADER_SCHEME_NAME = "SecurityHeader";

export function generateOpenAPI2(contract: Contract): OpenApiV2 {
  const typeTable = TypeTable.fromArray(contract.types);
  const openapi: OpenApiV2 = {
    swagger: "2.0",
    info: {
      title: contract.name,
      description: contract.description,
      version: "0.0.0"
    },
    consumes: ["application/json"],
    produces: ["application/json"],
    paths: endpointsToPathsObject(
      contract.endpoints,
      typeTable,
      contract.config
    ),
    definitions: contractTypesToDefinitionsObject(contract.types, typeTable),
    securityDefinitions: contractSecurityToSecurityDefinitionsObject(
      contract.security
    ),
    security: contract.security && [
      {
        [SECURITY_HEADER_SCHEME_NAME]: []
      }
    ]
  };

  return openapi;
}

function contractTypesToDefinitionsObject(
  types: Contract["types"],
  typeTable: TypeTable
): DefinitionsObject | undefined {
  if (types.length === 0) {
    return;
  }

  return types.reduce<DefinitionsObject>((acc, t) => {
    acc[t.name] = typeToSchemaObject(t.type, typeTable);
    return acc;
  }, {});
}

function contractSecurityToSecurityDefinitionsObject(
  security: Contract["security"]
): SecurityDefinitionsObject | undefined {
  return (
    security && {
      [SECURITY_HEADER_SCHEME_NAME]: {
        type: "apiKey",
        in: "header",
        name: security.name,
        description: security.description
      }
    }
  );
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

  return {
    tags: endpoint.tags.length > 0 ? endpoint.tags : undefined,
    description: endpoint.description,
    operationId: endpoint.name,
    parameters:
      endpointRequest &&
      endpointRequestToParameterObjects(endpointRequest, typeTable, config),
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
  const pathParameters: PathParameterObject[] = request.pathParams.map(p =>
    pathParamToPathParameterObject(p, typeTable)
  );

  const queryParameters: QueryParameterObject[] = request.queryParams.map(p =>
    queryParamToQueryParameterObject(p, typeTable, config)
  );

  const headerParameters: HeaderParameterObject[] = request.headers.map(p =>
    requestHeaderToHeaderParameterObject(p, typeTable)
  );

  const bodyParameter: BodyParameterObject | undefined = request.body && {
    in: "body",
    name: "Body", // name has no effect on the body parameter
    required: true, // TODO: currently Spot does not support optional request body
    schema: typeToSchemaObject(request.body.type, typeTable)
  };

  const parameters: ParameterObject[] = [];

  return parameters
    .concat(pathParameters, queryParameters, headerParameters)
    .concat(bodyParameter ?? []);
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
            acc[header.name] = responseHeaderToHeaderObject(header, typeTable);
            return acc;
          },
          {}
        )
      : undefined;

  const schema =
    response.body && typeToSchemaObject(response.body.type, typeTable);

  return { description, headers, schema };
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
