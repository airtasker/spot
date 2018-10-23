import assertNever from "assert-never";
import * as YAML from "js-yaml";
import { Api } from "../../models";
import { isVoid } from "../../validator";
import {
  openApi3Schema,
  OpenAPI3SchemaType,
  rejectVoidOpenApi3SchemaType,
  voidToNullOpenApi3SchemaType
} from "./openapi-3-schema";
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
                : defaultTo(openApi3Schema(endpoint.requestType), undefined)
            },
            identity
          ),
          responses: {
            default: {
              content: {
                "application/json": voidToNullOpenApi3SchemaType(
                  endpoint.genericErrorType
                )
              }
            },
            [(endpoint.successStatusCode || 200).toString(10)]: {
              content: {
                "application/json": voidToNullOpenApi3SchemaType(
                  endpoint.responseType
                )
              }
            },
            ...Object.entries(endpoint.specificErrorTypes).reduce(
              (acc, [errorName, specificError]) => {
                acc[specificError.statusCode.toString(10)] = {
                  content: {
                    "application/json": voidToNullOpenApi3SchemaType(
                      specificError.type
                    )
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
      [typeName: string]: OpenAPI3SchemaType;
    };
  };
}

export interface OpenAPIV3Operation {
  operationId: string;
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
  required: boolean;
  schema: OpenAPI3SchemaType;
}

export interface OpenAPIV3Response {
  content: {
    "application/json": OpenAPI3SchemaType;
  };
}
