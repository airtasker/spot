import * as YAML from "js-yaml";
import assertNever from "../../assert-never";
import { Api, Type } from "../../models";
import { isVoid } from "../../validator";
import {
  OpenAPI3SchemaType,
  openApi3TypeSchema,
  rejectVoidOpenApi3SchemaType
} from "./openapi3-schema";
import identity = require("lodash/identity");
import compact = require("lodash/compact");
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
    tags: [
      {
        name: "TODO"
      }
    ],
    info: {
      version: "0.0.0",
      title: "TODO",
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
          description: "TODO",
          tags: ["TODO"],
          parameters: compact(
            endpoint.path.map(
              (pathComponent): OpenAPIV3Parameter | null =>
                pathComponent.kind === "dynamic"
                  ? {
                      in: "path",
                      name: pathComponent.name,
                      description: "TODO",
                      required: true,
                      schema: rejectVoidOpenApi3SchemaType(
                        pathComponent.type,
                        `Unsupported void type for path component ${
                          pathComponent.name
                        }`
                      )
                    }
                  : null
            )
          ),
          ...pickBy(
            {
              requestBody: isVoid(api, endpoint.requestType)
                ? undefined
                : defaultTo(openApi3TypeSchema(endpoint.requestType), undefined)
            },
            identity
          ),
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
  in: "path" | "query";
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
