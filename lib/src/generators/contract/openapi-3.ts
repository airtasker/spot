import * as YAML from "js-yaml";
import { Api } from "../../models";
import { isVoid } from "../../validator";
import {
  jsonSchema,
  JsonSchemaType,
  noVoidJsonSchema,
  voidToNullJsonSchema
} from "./json-schema";
import identity = require("lodash/identity");
import compact = require("lodash/compact");
import pickBy = require("lodash/pickBy");
import defaultTo = require("lodash/defaultTo");

export function generateOpenApiV3(api: Api, format: "yaml") {
  return YAML.safeDump(openApiV3(api));
}

export function openApiV3(api: Api): OpenApiV3 {
  return {
    openapi: "3.0.0",
    info: {
      version: "0.0.0",
      title: "TODO"
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
          parameters: compact(
            endpoint.path.map(
              (pathComponent): OpenAPIV3Parameter | null =>
                pathComponent.kind === "dynamic"
                  ? {
                      in: "path",
                      name: pathComponent.name,
                      required: true,
                      schema: noVoidJsonSchema(
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
                : defaultTo(jsonSchema(endpoint.requestType), undefined)
            },
            identity
          ),
          responses: {
            default: {
              content: {
                "application/json": voidToNullJsonSchema(
                  endpoint.genericErrorType
                )
              }
            },
            [endpoint.successStatusCode.toString(10)]: {
              content: {
                "application/json": voidToNullJsonSchema(endpoint.responseType)
              }
            },
            ...Object.entries(endpoint.specificErrorTypes).reduce(
              (acc, [errorName, specificError]) => {
                acc[specificError.statusCode.toString(10)] = {
                  content: {
                    "application/json": voidToNullJsonSchema(specificError.type)
                  }
                };
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
          acc[typeName] = noVoidJsonSchema(
            type,
            `Unsupported void type ${typeName}`
          );
          return acc;
        },
        {} as { [typeName: string]: JsonSchemaType }
      )
    }
  };
}

export interface OpenApiV3 {
  openapi: "3.0.0";
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
      [typeName: string]: JsonSchemaType;
    };
  };
}

export interface OpenAPIV3Operation {
  operationId: string;
  parameters: OpenAPIV3Parameter[];
  requestBody?: JsonSchemaType;
  responses: {
    default?: OpenAPIV3Response;
    // Note: we use | undefined because otherwise "default" would have to be required.
    [statusCode: string]: OpenAPIV3Response | undefined;
  };
}

export interface OpenAPIV3Parameter {
  in: "path" | "query";
  name: string;
  required: boolean;
  schema: JsonSchemaType;
}

export interface OpenAPIV3Response {
  content: {
    "application/json": JsonSchemaType;
  };
}
