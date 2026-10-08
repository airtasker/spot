// The subset of OpenAPI 3.1.0 that Spot emits.
// https://spec.openapis.org/oas/v3.1.0

export interface OpenApiV31 {
  openapi: "3.1.0";
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
}

export interface InfoObject {
  title: string;
  description?: string;
  version: string;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: { [serverVariable: string]: ServerVariableObject };
}

export interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
}

export type ParameterObject =
  QueryParameterObject | HeaderParameterObject | PathParameterObject;

interface ParameterObjectBase {
  name: string;
  description?: string;
  required?: boolean;
  explode?: boolean;
  schema: SchemaObject;
  examples?: ExamplesSet;
}

export interface QueryParameterObject extends ParameterObjectBase {
  in: "query";
  style?: "form" | "deepObject";
}

export interface HeaderParameterObject extends ParameterObjectBase {
  in: "header";
}

export interface PathParameterObject extends ParameterObjectBase {
  in: "path";
  required: true;
}

export type HeaderObject = Omit<HeaderParameterObject, "name" | "in">;

export interface RequestBodyObject {
  content: { [mediaType: string]: MediaTypeObject };
  required?: boolean;
}

export interface MediaTypeObject {
  schema: SchemaObject;
}

export interface ResponsesObject {
  [statusCodeOrDefault: string]: ResponseObject;
}

export interface ResponseObject {
  description: string;
  headers?: { [name: string]: HeaderObject };
  content?: { [mediaType: string]: MediaTypeObject };
}

export interface ComponentsObject {
  schemas?: { [schema: string]: SchemaObject };
  securitySchemes?: { [securityScheme: string]: SecuritySchemeObject };
}

export interface SecuritySchemeObject {
  type: "apiKey";
  in: "header";
  name: string;
  description?: string;
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export interface ExampleObject {
  value: unknown;
}

export interface ExamplesSet {
  [example: string]: ExampleObject;
}

export type JsonType =
  "null" | "boolean" | "object" | "array" | "number" | "integer" | "string";

/**
 * A JSON Schema 2020-12 schema with the OpenAPI 3.1 vocabulary.
 *
 * Nullability is expressed through `type` or a `{ type: "null" }` member,
 * so there is no `nullable` keyword. Annotations such as `description` are
 * allowed beside `$ref`.
 */
export interface SchemaObject {
  $ref?: string;
  type?: JsonType | JsonType[];
  format?: "float" | "double" | "int32" | "int64" | "date" | "date-time";
  enum?: (string | number | boolean | null)[];

  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  deprecated?: boolean;

  properties?: { [name: string]: SchemaObject };
  required?: string[];
  additionalProperties?: boolean | SchemaObject;
  minProperties?: number;
  maxProperties?: number;

  items?: SchemaObject;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  minLength?: number;
  maxLength?: number;
  pattern?: string;

  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  discriminator?: DiscriminatorObject;
}

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: { [value: string]: string };
}
