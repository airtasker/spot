import * as YAML from "js-yaml";
import assertNever from "../../assert-never";
import { Api, Endpoint, Type } from "../../models";
import { isVoid } from "../../validator";
import {
  OpenAPI3SchemaType,
  openApi3TypeSchema,
  openApiV3ContentTypeSchema,
  rejectVoidOpenApi3SchemaType
} from "./openapi3-schema";
import compact = require("lodash/compact");
import uniqBy = require("lodash/uniqBy");
import pickBy = require("lodash/pickBy");
import defaultTo = require("lodash/defaultTo");

export function generateOpenApiV3(api: Api, format: "json" | "yaml") {
  const contract = openApiV3(api);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function openApiV3(api: Api): OpenApiV3 {
  return {
    openapi: "3.0.0",
    tags: getTags(api),
    info: {
      version: "0.0.0",
      title: api.description.name,
      ...pickBy({ description: api.description.description }),
      contact: {
        name: "TODO"
      }
    },
    paths: Object.entries(api.endpoints).reduce(
      (acc, [endpointName, endpoint]) => {
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
          operationId: endpointName,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: getParameters(api, endpoint),
          ...pickBy({
            requestBody: isVoid(api, endpoint.requestType)
              ? undefined
              : defaultTo(
                  openApiV3ContentTypeSchema(
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
      schemas: Object.entries(api.types).reduce(
        (acc, [typeName, type]) => {
          acc[typeName] = rejectVoidOpenApi3SchemaType(
            type,
            `Unsupported void type ${typeName}`
          );
          return acc;
        },
        {} as { [typeName: string]: OpenAPI3SchemaType }
      )
    }
  };
}

function getTags(api: Api): OpenAPIV3TagObject[] {
  return uniqBy(
    Object.entries(api.endpoints).reduce(
      (acc, [endpointName, endpoint]) => {
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

function getParameters(api: Api, endpoint: Endpoint): OpenAPIV3Parameter[] {
  const parameters = endpoint.path
    .map(
      (pathComponent): OpenAPIV3Parameter | null =>
        pathComponent.kind === "dynamic"
          ? {
              in: "path",
              name: pathComponent.name,
              description: pathComponent.description,
              required: true,
              schema: rejectVoidOpenApi3SchemaType(
                pathComponent.type,
                `Unsupported void type for path component ${pathComponent.name}`
              )
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
      Object.entries(endpoint.headers).map(
        ([headerName, header]): OpenAPIV3Parameter => {
          return {
            in: "header",
            name: header.headerFieldName,
            description: header.description,
            required: header.type.kind !== "optional",
            schema: rejectVoidOpenApi3SchemaType(
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

function response(api: Api, type: Type): OpenAPIV3Response {
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
