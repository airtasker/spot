import assertNever from "assert-never";
import YAML from "js-yaml";
import compact from "lodash/compact";
import pickBy from "lodash/pickBy";
import {
  BodyDefinition,
  ContractDefinition,
  DefaultResponseDefinition,
  EndpointDefinition
} from "../../models/definitions";
import {
  OpenAPI2SchemaType,
  OpenAPI2SchemaTypeObject,
  openApi2TypeSchema
} from "./openapi2-schema";

const SECURITY_HEADER_SCHEME_NAME = "securityHeader";

export function generateOpenApiV2(
  contractDefinition: ContractDefinition,
  format: "json" | "yaml"
) {
  const contract = openApiV2(contractDefinition);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract, {
        skipInvalid: true // for undefined
      });
    default:
      throw assertNever(format);
  }
}

export function openApiV2(contractDefinition: ContractDefinition): OpenApiV2 {
  return {
    swagger: "2.0",
    info: {
      version: "0.0.0",
      title: contractDefinition.api.name,
      ...pickBy({ description: contractDefinition.api.description }),
      contact: {
        name: "TODO"
      }
    },
    paths: contractDefinition.endpoints.reduce<{
      [endpointPath: string]: {
        [method: string]: OpenAPIV2Operation;
      };
    }>((acc, endpoint) => {
      const openApiPath = endpoint.path.replace(/:(\w+)/g, "{$1}");
      acc[openApiPath] = acc[openApiPath] || {};
      acc[openApiPath][endpoint.method.toLowerCase()] = {
        operationId: endpoint.name,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: getParameters(endpoint),
        responses: {
          ...(endpoint.defaultResponse
            ? { default: response(endpoint.defaultResponse) }
            : {}),
          ...endpoint.responses.reduce<{
            [statusCode: string]: OpenAPIV2Response;
          }>((acc, responseNode) => {
            acc[responseNode.status.toString(10)] = response(responseNode);
            return acc;
          }, {})
        }
      };
      return acc;
    }, {}),
    definitions: contractDefinition.types.reduce<{
      [typeName: string]: OpenAPI2SchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = openApi2TypeSchema(typeNode.type);
      return acc;
    }, {}),
    ...(contractDefinition.api.securityHeader
      ? {
          securityDefinitions: {
            [SECURITY_HEADER_SCHEME_NAME]: {
              type: "apiKey",
              in: "header",
              name: contractDefinition.api.securityHeader.name,
              description: contractDefinition.api.securityHeader.description
            }
          },
          security: [
            {
              [SECURITY_HEADER_SCHEME_NAME]: []
            }
          ]
        }
      : {})
  };
}

function getParameters(endpoint: EndpointDefinition): OpenAPIV2Parameter[] {
  const parameters = endpoint.request.pathParams
    .map(
      (pathParam): OpenAPIV2Parameter => {
        const schemaType = openApi2TypeSchema(pathParam.type);
        if ("type" in schemaType && schemaType.type === "object") {
          throw new Error(`Unsupported object type in path parameter`);
        }
        return {
          in: "path",
          name: pathParam.name,
          description: pathParam.description,
          ...schemaType,
          required: true
        };
      }
    )
    .concat(endpoint.request.body ? [requestBody(endpoint.request.body)] : [])
    .concat(
      endpoint.request.queryParams.map(
        (queryParam): OpenAPIV2Parameter => {
          const schemaType = openApi2TypeSchema(queryParam.type);
          if ("type" in schemaType && schemaType.type === "object") {
            throw new Error(`Unsupported object type in query parameter`);
          }
          return {
            in: "query",
            name: queryParam.name,
            description: queryParam.description,
            ...schemaType,
            required: !queryParam.optional
          };
        }
      )
    )
    .concat(
      endpoint.request.headers.map(
        (header): OpenAPIV2Parameter => {
          const schemaType = openApi2TypeSchema(header.type);
          if ("type" in schemaType && schemaType.type === "object") {
            throw new Error(`Unsupported object type in header`);
          }
          return {
            in: "header",
            name: header.name,
            description: header.description,
            ...schemaType,
            required: !header.optional
          };
        }
      )
    );
  return compact(parameters);
}

function requestBody(body: BodyDefinition): OpenAPIV2Parameter {
  return {
    in: "body",
    name: "body",
    description: "TODO",
    required: true,
    schema: openApi2TypeSchema(body.type)
  };
}

function response(response: DefaultResponseDefinition): OpenAPIV2Response {
  return {
    schema: response.body && openApi2TypeSchema(response.body.type),
    headers: response.headers.reduce<{
      [header: string]: OpenAPIV2Header;
    }>((headerAcc, header) => {
      const schemaType = openApi2TypeSchema(header.type);
      headerAcc[header.name] = {
        ...schemaType,
        description: header.description
      };
      return headerAcc;
    }, {}),
    description: response.description || ""
  };
}

export interface OpenApiV2 {
  swagger: "2.0";
  tags?: OpenAPIV2TagObject[];
  info: {
    version: string;
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  host?: string;
  paths: {
    [endpointPath: string]: {
      [method: string]: OpenAPIV2Operation;
    };
  };
  definitions: {
    [typeName: string]: OpenAPI2SchemaType;
  };
  securityDefinitions?: {
    [securitySchemeName: string]: OpenAPIV2SecurityScheme;
  };
  security?: {
    [securitySchemeName: string]: string[];
  }[];
}

export interface OpenAPIV2TagObject {
  name: string;
  description?: string;
}

export interface OpenAPIV2Operation {
  operationId: string;
  description?: string;
  tags?: string[];
  parameters: OpenAPIV2Parameter[];
  requestBody?: OpenAPI2SchemaType;
  responses: {
    default?: OpenAPIV2Response;
    // Note: we use | undefined because otherwise "default" would have to be required.
    [statusCode: string]: OpenAPIV2Response | undefined;
  };
}

export type OpenAPIV2Parameter =
  | OpenAPIV2BodyParameter
  | OpenAPIV2NonBodyParameter;

export type OpenAPIV2NonBodyParameter = {
  in: "path" | "query" | "header";
  name: string;
  description?: string;
  required: boolean;
} & Exclude<OpenAPI2SchemaType, OpenAPI2SchemaTypeObject>;

export type OpenAPIV2BodyParameter = {
  in: "body";
  name: "body";
  description?: string;
  required: boolean;
  schema: OpenAPI2SchemaType | undefined;
};

export interface OpenAPIV2Response {
  schema?: OpenAPI2SchemaType;
  headers?: {
    [header: string]: OpenAPIV2Header;
  };
  description: string;
}

export type OpenAPIV2Header = {
  description?: string;
} & OpenAPI2SchemaType;

// TODO: Consider adding support for other security schemes.
export type OpenAPIV2SecurityScheme = OpenApiV2SecurityScheme_ApiKey;

export interface OpenApiV2SecurityScheme_ApiKey {
  type: "apiKey";
  description?: string;
  name: string;
  in: "query" | "header";
}
