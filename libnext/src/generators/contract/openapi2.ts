import assertNever from "assert-never";
import * as YAML from "js-yaml";
import {
  BodyNode,
  ContractNode,
  DefaultResponseNode,
  EndpointNode
} from "../../models/nodes";
import {
  OpenAPI2SchemaType,
  OpenAPI2SchemaTypeObject,
  openApi2TypeSchema
} from "./openapi2-schema";
import compact = require("lodash/compact");
import pickBy = require("lodash/pickBy");

export function generateOpenApiV2(
  contractNode: ContractNode,
  format: "json" | "yaml"
) {
  const contract = openApiV2(contractNode);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function openApiV2(contractNode: ContractNode): OpenApiV2 {
  return {
    swagger: "2.0",
    info: {
      version: "0.0.0",
      title: contractNode.api.name,
      ...pickBy({ description: contractNode.api.description }),
      contact: {
        name: "TODO"
      }
    },
    paths: contractNode.endpoints.reduce(
      (acc, endpoint) => {
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
      },
      {} as {
        [endpointPath: string]: {
          [method: string]: OpenAPIV2Operation;
        };
      }
    ),
    definitions: contractNode.types.reduce<{
      [typeName: string]: OpenAPI2SchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = openApi2TypeSchema(typeNode.type);
      return acc;
    }, {})
  };
}

function getParameters(endpoint: EndpointNode): OpenAPIV2Parameter[] {
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

function requestBody(body: BodyNode): OpenAPIV2Parameter {
  return {
    in: "body",
    name: "body",
    description: "TODO",
    required: !body.optional,
    schema: openApi2TypeSchema(body.type)
  };
}

function response(response: DefaultResponseNode): OpenAPIV2Response {
  return {
    schema: response.body && openApi2TypeSchema(response.body.type),
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
  description: string;
}
