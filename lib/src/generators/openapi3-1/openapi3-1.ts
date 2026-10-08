import assertNever from "assert-never";
import {
  Body,
  Config,
  Contract,
  DefaultResponse,
  Endpoint,
  Example,
  Header,
  HttpMethod,
  isSpecificResponse,
  Oa3ServerVariable,
  Request,
  Response
} from "../../definitions";
import {
  areStringLiteralTypes,
  isArrayType,
  isNotNullType,
  isObjectType,
  isUnionType,
  possibleRootTypes,
  Type,
  TypeTable
} from "../../types";
import { KeyOfType } from "../../util";
import {
  ComponentsObject,
  ExamplesSet,
  HeaderObject,
  HeaderParameterObject,
  OpenApiV31,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathParameterObject,
  PathsObject,
  QueryParameterObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
  ServerObject,
  ServerVariableObject
} from "./openapi3-1-specification";
import { typeToSchemaObject } from "./openapi3-1-type-util";

const SECURITY_HEADER_SCHEME_NAME = "SecurityHeader";

/**
 * The returned document is plain JSON data: it has no `undefined` values and
 * no shared object references, so it equals what is written to disk.
 */
export function generateOpenAPI31(contract: Contract): OpenApiV31 {
  const typeTable = TypeTable.fromArray(contract.types);

  const openapi: OpenApiV31 = {
    openapi: "3.1.0",
    info: {
      title: contract.name,
      description: contract.description,
      version: contract.version ?? "0.0.0"
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
    ],
    servers: contract.oa3servers && contractToOa3ServerObject(contract)
  };

  return JSON.parse(JSON.stringify(openapi));
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
  if (
    endpoint.responses.length === 0 &&
    endpoint.defaultResponse === undefined
  ) {
    throw new Error(
      `Endpoint (${endpoint.name}) does not declare any response. OpenAPI 3.1 requires at least one response per operation.`
    );
  }

  const endpointRequest = endpoint.request;
  const endpointRequestBody = endpointRequest?.body;

  return {
    tags: endpoint.tags.length > 0 ? endpoint.tags : undefined,
    description: endpoint.description,
    summary: endpoint.summary,
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
    schema: typeToSchemaObject(p.type, typeTable),
    examples: exampleToOpenApiExampleSet(p.examples)
  }));

  const queryParameters: QueryParameterObject[] = request.queryParams.map(
    p => ({
      name: p.name,
      in: "query",
      description: p.description,
      ...typeToQueryParameterSerializationStrategy(p.type, typeTable, config),
      required: !p.optional,
      schema: typeToSchemaObject(p.type, typeTable),
      examples: exampleToOpenApiExampleSet(p.examples)
    })
  );

  const headerParameters: HeaderParameterObject[] = request.headers.map(p => ({
    name: p.name,
    in: "header",
    description: p.description,
    required: !p.optional,
    schema: typeToSchemaObject(p.type, typeTable),
    examples: exampleToOpenApiExampleSet(p.examples)
  }));

  const parameters: ParameterObject[] = [];

  return parameters.concat(pathParameters, queryParameters, headerParameters);
}

/**
 * A query parameter that may be either an object or an array has no single
 * serialisation style, so it gets neither `style` nor `explode`.
 */
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
  return {
    content: {
      "application/json": {
        schema: typeToSchemaObject(requestBody.type, typeTable)
      }
    },
    required: true
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
      schema: typeToSchemaObject(response.body.type, typeTable)
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
    schema: typeToSchemaObject(header.type, typeTable),
    examples: exampleToOpenApiExampleSet(header.examples)
  };
}

function contractTypesToComponentsObjectSchemas(
  types: Contract["types"],
  typeTable: TypeTable
): { [schema: string]: SchemaObject } {
  return types.reduce<{ [schema: string]: SchemaObject }>((acc, t) => {
    acc[t.name] = {
      ...typeToSchemaObject(t.typeDef.type, typeTable),
      description: t.typeDef.description
    };
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
    case "HEAD":
      return "head";
    default:
      assertNever(method);
  }
}

function exampleToOpenApiExampleSet(
  examples?: Example[]
): ExamplesSet | undefined {
  return examples?.reduce<ExamplesSet>((acc, example: Example) => {
    acc[example.name] = {
      value: example.value
    };
    return acc;
  }, {});
}

function contractToOa3ServerObject(
  contract: Contract
): ServerObject[] | undefined {
  if (contract.oa3servers?.length === 0) {
    return undefined;
  }

  return contract.oa3servers?.map(server => ({
    url: server.url,
    description: server.description,
    variables:
      server.oa3ServerVariables.length > 0
        ? server.oa3ServerVariables.reduce<{
            [serverVariable: string]: ServerVariableObject;
          }>((acc, serverVariable) => {
            acc[serverVariable.parameterName] =
              oa3ServerVariableToServerVariableObject(serverVariable);
            return acc;
          }, {})
        : undefined
  }));
}

function oa3ServerVariableToServerVariableObject(
  oa3ServerVariable: Oa3ServerVariable
): ServerVariableObject {
  if (isUnionType(oa3ServerVariable.type)) {
    const nonNullTypes = oa3ServerVariable.type.types.filter(isNotNullType);
    if (areStringLiteralTypes(nonNullTypes)) {
      return {
        default: oa3ServerVariable.defaultValue,
        enum: nonNullTypes.map(t => t.value)
      };
    }
  }
  return {
    default: oa3ServerVariable.defaultValue
  };
}
