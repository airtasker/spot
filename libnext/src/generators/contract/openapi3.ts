import assertNever from "assert-never";
import * as YAML from "js-yaml";
import { ContractNode, EndpointNode } from "../../models/nodes";
import { OpenAPI3SchemaType, openApi3TypeSchema, openApiV3ContentTypeSchema } from "./openapi3-schema";
import compact = require("lodash/compact");
import uniqBy = require("lodash/uniqBy");
import pickBy = require("lodash/pickBy");
import defaultTo = require("lodash/defaultTo");

export function generateOpenApiV3(contractNode: ContractNode, format: "json" | "yaml") {
  const contract = openApiV3(contractNode);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function openApiV3(contractNode: ContractNode): OpenApiV3 {
  return {
    openapi: "3.0.0",
    tags: getTags(api),
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
        const openApiPath = endpoint.path
          .map(
            pathComponent =>
              pathComponent.kind === "dynamic"
                ? `{${pathComponent.name}}`
                : pathComponent.content
          )
          .join("");
        acc[openApiPath] = acc[openApiPath] || {};
        acc[openApiPath][endpoint.method.toLowerCase()] = {
          operationId: endpoint.name,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: getParameters(api, endpoint),
          ...pickBy({
            requestBody: isVoid(api, endpoint.requestType)
              ? undefined
              : defaultTo(
                  openApiV3ContentTypeSchema(
                    api.types,
                    defaultTo(endpoint.requestContentType, "application/json"),
                    endpoint.requestType
                  ),
                  undefined
                )
          }),
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
              {} as { [statusCode: string]: OpenAPIV3Response }
            )
          }
        };
        return acc;
      },
      {} as {
        [endpointPath: string]: {
          [method: string]: OpenAPIV3Operation;
        };
      }
    ),
    components: {
      schemas: contractNode.types.reduce<{ [typeName: string]: OpenAPI3SchemaType }>(
        (acc, typeNode) => {
          acc[typeNode.name] = openApiV3ContentTypeSchema(typeNode.type)
          return acc;
        },
        {}
      )
    }
  };
}

function getTags(contractNode: ContractNode): OpenAPIV3TagObject[] {
  return uniqBy(
    contractNode.endpoints.reduce(
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
      [] as OpenAPIV3TagObject[]
    ),
    "name"
  );
}

function getParameters(endpoint: EndpointNode): OpenAPIV3Parameter[] {
  const parameters = endpoint.path
    .map(
      (pathComponent): OpenAPIV3Parameter | null =>
        pathComponent.kind === "dynamic"
          ? {
              in: "path",
              name: pathComponent.name,
              description: pathComponent.description,
              required: true,
              schema: pathComponent.type
          }
          : null
    )
    .concat(
      endpoint.queryParams.map(
        (queryComponent): OpenAPIV3Parameter => {
          return {
            in: "query",
            name: queryComponent.queryName
              ? queryComponent.queryName
              : queryComponent.name,
            description: queryComponent.description,
            required: queryComponent.type.kind !== "optional",
            schema: rejectVoidOpenApi3SchemaType(
              api.types,
              queryComponent.type.kind === "optional"
                ? queryComponent.type.optional
                : queryComponent.type,
              `Unsupported void type for query params${queryComponent.name}`
            )
          };
        }
      )
    )
    .concat(
      endpoint.headers.map(
        ([headerName, header]): OpenAPIV3Parameter => {
          return {
            in: "header",
            name: header.headerFieldName,
            description: header.description,
            required: header.type.kind !== "optional",
            schema: rejectVoidOpenApi3SchemaType(
              api.types,
              header.type.kind === "optional"
                ? header.type.optional
                : header.type,
              `Unsupported void type for header ${header.headerFieldName}`
            )
          };
        }
      )
    );
  return compact(parameters);
}

function response(type: Type): OpenAPIV3Response {
  const schemaType = openApi3TypeSchema(type);
  return {
    ...(schemaType
      ? {
          content: {
            "application/json": {
              schema: schemaType
            }
          }
        }
      : {}),
    description: ""
  };
}

export interface OpenApiV3 {
  openapi: "3.0.0";
  tags?: OpenAPIV3TagObject[];
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
  servers?: {
    url: string;
    description?: string;
  }[];
  paths: {
    [endpointPath: string]: {
      [method: string]: OpenAPIV3Operation;
    };
  };
  components: {
    schemas: {
      [typeName: string]: OpenAPI3SchemaType;
    };
  };
}

export interface OpenAPIV3TagObject {
  name: string;
  description?: string;
}

export interface OpenAPIV3Operation {
  operationId: string;
  description?: string;
  tags?: string[];
  parameters: OpenAPIV3Parameter[];
  requestBody?: OpenAPI3SchemaType;
  responses: {
    default?: OpenAPIV3Response;
    // Note: we use | undefined because otherwise "default" would have to be required.
    [statusCode: string]: OpenAPIV3Response | undefined;
  };
}

export interface OpenAPIV3Parameter {
  in: "path" | "query" | "header";
  name: string;
  description?: string;
  required: boolean;
  schema: OpenAPI3SchemaType;
}

export interface OpenAPIV3Response {
  content?: {
    "application/json": {
      schema: OpenAPI3SchemaType;
    };
  };
  description: string;
}
