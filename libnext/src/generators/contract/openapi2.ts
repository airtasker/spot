import { HttpContentType } from "@airtasker/spot";
import assertNever from "assert-never";
import * as YAML from "js-yaml";
import { ContractNode } from "libnext/src/models/nodes";
import { DataType } from "libnext/src/models/types";
import { OpenAPI2SchemaType, openApi2TypeSchema } from "./openapi2-schema";
import compact = require("lodash/compact");
import uniqBy = require("lodash/uniqBy");
import defaultTo = require("lodash/defaultTo");
import pickBy = require("lodash/pickBy");

export function generateOpenApiV2(contractNode: ContractNode, format: "json" | "yaml") {
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
    tags: getTags(contractNode),
    info: {
      version: "0.0.0",
      title: contractNode.api.name,
      ...pickBy({ description: contractNode.api.description }),
      contact: {
        name: "TODO"
      }
    },
    paths: Object.entries(contractNode.endpoints).reduce(
      (acc, [endpointName, endpoint]) => {
        const openApiPath = endpoint.path.replace(/:(\w+)/g, '{$1}')
        acc[openApiPath] = acc[openApiPath] || {};
        acc[openApiPath][endpoint.method.toLowerCase()] = {
          operationId: endpointName,
          description: endpoint.description,
          consumes: ["application/json"],
          tags: endpoint.tags,
          parameters: getParameters(api, endpoint),
          responses: {
            default: response(api, endpoint.genericErrorType),
            [(endpoint.successStatusCode || 200).toString(10)]: response(
              api,
              endpoint.responseType
            ),
            ...Object.entries(endpoint.specificErrorTypes).reduce(
              (acc, [errorName, specificError]) => {
                acc[specificError.statusCode.toString(10)] = response(
                  api,
                  specificError.type
                );
                return acc;
              },
              {} as { [statusCode: string]: OpenAPIV2Response }
            )
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
    definitions: contractNode.types.reduce<{ [typeName: string]: OpenAPI2SchemaType }>(
      (acc, typeNode) => {
        acc[typeNode.name] = openApi2TypeSchema(typeNode.type);
        return acc;
      },
      {}
    )
  };
}

function getTags(contractNode: ContractNode): OpenAPIV2TagObject[] {
  return uniqBy(
    contractNode.endpoints.reduce<OpenAPIV2TagObject[]>(
      (acc, endpoint) => {
        if (endpoint.tags) {
          acc = acc.concat(
            endpoint.tags.map(tag => {
              return { name: tag };
            })
          );
        }
        return acc;
      },
      []
    ),
    "name"
  );
}

function getParameters(contractNode: ContractNode, endpoint: Endpoint): OpenAPIV2Parameter[] {
  const parameters = endpoint.path
    .map(
      (pathComponent): OpenAPIV2Parameter | null =>
        pathComponent.kind === "dynamic"
          ? {
              in: "path",
              name: pathComponent.name,
              description: pathComponent.description,
              ...rejectVoidOpenApi2SchemaType(
                api.types,
                pathComponent.type,
                `Unsupported void type for path component ${pathComponent.name}`
              ),
              required: true
            }
          : null
    )
    .concat([requestBody(api, endpoint.requestType)])
    .concat(
      endpoint.queryParams.map(
        (queryComponent): OpenAPIV2Parameter => {
          return {
            in: "query",
            name: queryComponent.queryName
              ? queryComponent.queryName
              : queryComponent.name,
            description: queryComponent.description,
            ...rejectVoidOpenApi2SchemaType(
              api.types,
              queryComponent.type.kind === "optional"
                ? queryComponent.type.optional
                : queryComponent.type,
              `Unsupported void type for query params ${queryComponent.name}`
            ),
            required: queryComponent.type.kind !== "optional"
          };
        }
      )
    )
    .concat(
      Object.entries(endpoint.headers).map(
        ([headerName, header]): OpenAPIV2Parameter => {
          return {
            in: "header",
            name: header.headerFieldName,
            description: header.description,
            ...rejectVoidOpenApi2SchemaType(
              api.types,
              header.type.kind === "optional"
                ? header.type.optional
                : header.type,
              `Unsupported void type for header ${header.headerFieldName}`
            ),
            required: header.type.kind !== "optional"
          };
        }
      )
    );
  return compact(parameters);
}

function requestBody(contractNode: ContractNode, type: DataType): OpenAPIV2Parameter | null {
  return {
        in: "body",
        name: "body",
        description: "TODO",
        required: true,
        schema: defaultTo(openApi2TypeSchema(type), undefined)
      };
}

function response(type: DataType): OpenAPIV2Response {
  return {
          schema: openApi2TypeSchema(type),
    description: ""
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
  consumes?: HttpContentType[];
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
} & OpenAPI2SchemaType;

export type OpenAPIV2BodyParameter = {
  in: "body";
  name: "body";
  description?: string;
  required: true;
  schema: OpenAPI2SchemaType | undefined;
};

export interface OpenAPIV2Response {
  schema?: OpenAPI2SchemaType;
  description: string;
}
