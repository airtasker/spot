import assertNever from "assert-never";
import YAML from "js-yaml";
import compact from "lodash/compact";
import pickBy from "lodash/pickBy";
import {
  ContractDefinition,
  DefaultResponseDefinition,
  EndpointDefinition,
  TypeDefinition
} from "../../models/definitions";
import { TypeKind } from "../../models/types";
import { resolveType } from "../../verifiers/utilities/type-resolver";
import { OpenAPI3SchemaType, openApi3TypeSchema } from "./openapi3-schema";

const SECURITY_HEADER_SCHEME_NAME = "securityHeader";

export function generateOpenApiV3(
  contractDefinition: ContractDefinition,
  format: "json" | "yaml"
) {
  const contract = openApiV3(contractDefinition);
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

export function openApiV3(contractDefinition: ContractDefinition): OpenApiV3 {
  return {
    openapi: "3.0.0",
    info: {
      version: "0.0.0",
      title: contractDefinition.api.name,
      ...pickBy({ description: contractDefinition.api.description }),
      contact: {
        name: "TODO"
      }
    },
    ...(contractDefinition.api.securityHeader
      ? {
          security: [
            {
              [SECURITY_HEADER_SCHEME_NAME]: []
            }
          ]
        }
      : {}),
    paths: contractDefinition.endpoints.reduce<{
      [endpointPath: string]: {
        [method: string]: OpenAPIV3Operation;
      };
    }>((acc, endpoint) => {
      const openApiPath = endpoint.path.replace(/:(\w+)/g, "{$1}");
      acc[openApiPath] = acc[openApiPath] || {};
      acc[openApiPath][endpoint.method.toLowerCase()] = {
        operationId: endpoint.name,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: getParameters(contractDefinition.types, endpoint),
        ...(endpoint.request.body && {
          requestBody: {
            content: {
              "application/json": {
                schema: openApi3TypeSchema(
                  contractDefinition.types,
                  endpoint.request.body.type
                )
              }
            },
            description: endpoint.description || ""
          }
        }),
        responses: {
          ...(endpoint.defaultResponse
            ? {
                default: response(
                  contractDefinition.types,
                  endpoint.defaultResponse
                )
              }
            : {}),
          ...endpoint.responses.reduce<{
            [statusCode: string]: OpenAPIV3Body;
          }>((acc, responseNode) => {
            acc[responseNode.status.toString(10)] = response(
              contractDefinition.types,
              responseNode
            );
            return acc;
          }, {})
        }
      };
      return acc;
    }, {}),
    components: {
      schemas: contractDefinition.types.reduce<{
        [typeName: string]: OpenAPI3SchemaType;
      }>((acc, typeNode) => {
        acc[typeNode.name] = openApi3TypeSchema(
          contractDefinition.types,
          typeNode.type
        );
        return acc;
      }, {}),
      securitySchemes: contractDefinition.api.securityHeader
        ? {
            [SECURITY_HEADER_SCHEME_NAME]: {
              type: "apiKey",
              in: "header",
              name: contractDefinition.api.securityHeader.name,
              description: contractDefinition.api.securityHeader.description
            }
          }
        : {}
    }
  };
}

function getParameters(
  types: TypeDefinition[],
  endpoint: EndpointDefinition
): OpenAPIV3Parameter[] {
  const parameters = endpoint.request.pathParams
    .map(
      (pathParam): OpenAPIV3Parameter => {
        const resolvedType = resolveType(pathParam.type, types);
        const schemaType = openApi3TypeSchema(types, pathParam.type);
        return {
          in: "path",
          name: pathParam.name,
          description: pathParam.description,
          schema: schemaType,
          required: true,
          ...(resolvedType.kind === TypeKind.OBJECT
            ? {
                style: "deepObject",
                explode: true
              }
            : resolvedType.kind === TypeKind.ARRAY
            ? {
                style: "pipeDelimited",
                explode: true
              }
            : {})
        };
      }
    )
    .concat(
      endpoint.request.queryParams.map(
        (queryParam): OpenAPIV3Parameter => {
          const schemaType = openApi3TypeSchema(types, queryParam.type);
          return {
            in: "query",
            name: queryParam.name,
            description: queryParam.description,
            schema: schemaType,
            required: !queryParam.optional
          };
        }
      )
    )
    .concat(
      endpoint.request.headers.map(
        (header): OpenAPIV3Parameter => {
          const schemaType = openApi3TypeSchema(types, header.type);
          if ("type" in schemaType && schemaType.type === "object") {
            throw new Error(`Unsupported object type in header`);
          }
          return {
            in: "header",
            name: header.name,
            description: header.description,
            schema: schemaType,
            required: !header.optional
          };
        }
      )
    );
  return compact(parameters);
}

function response(
  types: TypeDefinition[],
  response: DefaultResponseDefinition
): OpenAPIV3Body {
  return {
    ...(response.body && {
      content: {
        "application/json": {
          schema: openApi3TypeSchema(types, response.body.type)
        }
      }
    }),
    headers: response.headers.reduce<{
      [header: string]: {
        description?: string;
        required: boolean;
        schema: OpenAPI3SchemaType;
      };
    }>((headerAcc, header) => {
      const schemaType = openApi3TypeSchema(types, header.type);
      headerAcc[header.name] = {
        description: header.description,
        required: !header.optional,
        schema: schemaType
      };
      return headerAcc;
    }, {}),
    description: response.description || ""
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
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  security?: Array<{
    [securitySchemeName: string]: string[];
  }>;
  paths: {
    [endpointPath: string]: {
      [method: string]: OpenAPIV3Operation;
    };
  };
  components: {
    schemas: {
      [typeName: string]: OpenAPI3SchemaType;
    };
    securitySchemes?: {
      [securitySchemeName: string]: OpenAPIV3SecurityScheme;
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
  requestBody?: OpenAPIV3Body;
  responses: {
    default?: OpenAPIV3Body;
    // Note: we use | undefined because otherwise "default" would have to be required.
    [statusCode: string]: OpenAPIV3Body | undefined;
  };
}

export interface OpenAPIV3Parameter {
  in: "path" | "query" | "header";
  name: string;
  description?: string;
  required: boolean;
  schema: OpenAPI3SchemaType;
  explode?: boolean;
  style?:
    | "matrix"
    | "label"
    | "form"
    | "simple"
    | "spaceDelimited"
    | "pipeDelimited"
    | "deepObject";
}

export interface OpenAPIV3Body {
  content?: {
    "application/json": {
      schema: OpenAPI3SchemaType;
    };
  };
  headers?: {
    [header: string]: {
      description?: string;
      required: boolean;
      schema: OpenAPI3SchemaType;
    };
  };
  description: string;
}

// TODO: Consider adding support for other security schemes.
export type OpenAPIV3SecurityScheme = OpenApiV3SecurityScheme_ApiKey;

// tslint:disable-next-line:class-name
export interface OpenApiV3SecurityScheme_ApiKey {
  type: "apiKey";
  description?: string;
  name: string;
  in: "query" | "header" | "cookie";
}
