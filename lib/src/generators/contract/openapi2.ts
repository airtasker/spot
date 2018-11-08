import * as YAML from "js-yaml";
import assertNever from "../../assert-never";
import {Api, Endpoint, Type} from "../../models";
import {isVoid} from "../../validator";
import {
  OpenAPI2SchemaType,
  openApi2TypeSchema,
  rejectVoidOpenApi2SchemaType
} from "./openapi2-schema";
import compact = require("lodash/compact");
import defaultTo = require("lodash/defaultTo");

export function generateOpenApiV2(api: Api, format: "json" | "yaml") {
  const contract = openApiV2(api);
  switch (format) {
    case "json":
      return JSON.stringify(contract, null, 2);
    case "yaml":
      return YAML.safeDump(contract);
    default:
      throw assertNever(format);
  }
}

export function openApiV2(api: Api): OpenApiV2 {
  function getParameters(endpoint: Endpoint): OpenAPIV2Parameter[] {
    const parameters = endpoint.path.map(
      (pathComponent): OpenAPIV2Parameter | null =>
        pathComponent.kind === "dynamic"
          ? {
            in: "path",
            name: pathComponent.name,
            description: "TODO",
            ...rejectVoidOpenApi2SchemaType(
              pathComponent.type,
              `Unsupported void type for path component ${
                pathComponent.name
                }`
            ),
            required: true
          }
          : null
    ).concat([requestBody(api, endpoint.requestType)])
    return compact(parameters);
  }

  return {
    swagger: "2.0",
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
          parameters: getParameters(endpoint),
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
    definitions: Object.entries(api.types).reduce(
      (acc, [typeName, type]) => {
        acc[typeName] = rejectVoidOpenApi2SchemaType(
          type,
          `Unsupported void type ${typeName}`
        );
        return acc;
      },
      {} as { [typeName: string]: OpenAPI2SchemaType }
    )
  };
}

function requestBody(api: Api, type: Type): OpenAPIV2Parameter | null {
  return isVoid(api, type) ? null :
    {
      in: "body",
      name: "body",
      description: "TODO",
      required: true,
      schema: defaultTo(openApi2TypeSchema(type), undefined)
    }
}

function response(api: Api, type: Type): OpenAPIV2Response {
  const schemaType = openApi2TypeSchema(type);
  return {
    ...(schemaType
      ? {
          schema: schemaType
        }
      : {}),
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
  | OpenAPIV2NonBodyParameter

export type OpenAPIV2NonBodyParameter = {
  in: "path" | "query";
  name: string;
  description?: string;
  required: boolean;
} & OpenAPI2SchemaType;

export type OpenAPIV2BodyParameter = {
  in: "body";
  name: string;
  description?: string;
  required: boolean;
  schema: OpenAPI2SchemaType | undefined
};

export interface OpenAPIV2Response {
  schema?: OpenAPI2SchemaType;
  description: string;
}
