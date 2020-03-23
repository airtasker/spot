// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#swagger-object
export interface OpenApiV2 {
  swagger: "2.0";
  info: InfoObject;
  host?: string;
  basePath?: string;
  schemes?: Schemes[];
  consumes?: string[];
  produces?: string[];
  paths: PathsObject;
  definitions?: DefinitionsObject;
  parameters?: ParametersDefinitionsObject;
  responses?: ResponsesDefinitionsObject;
  securityDefinitions?: SecurityDefinitionsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#infoObject
export interface InfoObject {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  version: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#contactObject
export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#licenseObject
export interface LicenseObject {
  name: string;
  url?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#paths-object
export interface PathsObject {
  [path: string]: PathItemObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#pathItemObject
export interface PathItemObject {
  $ref?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  parameters?: (ParameterObject | ReferenceObject)[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#operationObject
export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  operationId?: string;
  consumes?: string[];
  produces?: string[];
  parameters?: (ParameterObject | ReferenceObject)[];
  responses: ResponsesObject;
  schemes?: Schemes[];
  deprecated?: boolean;
  security?: SecurityRequirementObject[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responsesObject
export interface ResponsesObject {
  [statusCodeOrDefault: string]: ResponseObject | ReferenceObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responseObject
export interface ResponseObject {
  description: string;
  schema?: SchemaObject;
  headers?: HeadersObject;
  examples?: ExampleObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#headersObject
export interface HeadersObject {
  [name: string]: HeaderObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#headerObject
export type HeaderObject =
  | StringHeaderObject
  | NumberHeaderObject
  | IntegerHeaderObject
  | BooleanHeaderObject
  | ArrayHeaderObject;

export interface StringHeaderObject
  extends HeaderObjectBase,
    StringParameterObject {}

export interface NumberHeaderObject
  extends HeaderObjectBase,
    NumberParameterObjectType {}

export interface IntegerHeaderObject
  extends HeaderObjectBase,
    IntegerParameterObjectType {}

export interface BooleanHeaderObject
  extends HeaderObjectBase,
    BooleanParameterObjectType {}

export interface ArrayHeaderObject
  extends HeaderObjectBase,
    ArrayParameterObjectType {}

interface HeaderObjectBase {
  description?: string;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parameterObject
 * There is a fair amount of duplication with the header object, however the differences
 * are complex enough to warrant keeping the definitions completely isolated from each other.
 */
export type ParameterObject =
  | QueryParameterObject
  | HeaderParameterObject
  | PathParameterObject
  | FormDataParameterObject
  | BodyParameterObject;

export type QueryParameterObject = {
  in: "query";
  allowEmptyValue?: boolean;
} & ParameterObjectBase &
  QueryParameterObjectType;

export type HeaderParameterObject = {
  in: "header";
} & ParameterObjectBase &
  HeaderParameterObjectType;

export type PathParameterObject = {
  in: "path";
  required: true;
} & ParameterObjectBase &
  PathParameterObjectType;

export type FormDataParameterObject = {
  in: "formData";
  allowEmptyValue?: boolean;
} & ParameterObjectBase &
  FormDataParameterObjectType;

export type BodyParameterObject = {
  in: "body";
  schema: SchemaObject;
} & ParameterObjectBase;

interface ParameterObjectBase {
  name: string;
  in: "query" | "header" | "path" | "formData" | "body";
  description?: string;
  required?: boolean;
}

type QueryParameterObjectType =
  | BaseParameterObjectTypes
  | ArrayMultiParameterObjectType;

type HeaderParameterObjectType =
  | BaseParameterObjectTypes
  | ArrayParameterObjectType;

type PathParameterObjectType =
  | BaseParameterObjectTypes
  | ArrayParameterObjectType;

type FormDataParameterObjectType =
  | BaseParameterObjectTypes
  | ArrayMultiParameterObjectType
  | FileParameterObjectType;

type BaseParameterObjectTypes =
  | StringParameterObject
  | NumberParameterObjectType
  | IntegerParameterObjectType
  | BooleanParameterObjectType;

export interface StringParameterObject {
  type: "string";
  format?: "byte" | "binary" | "date" | "date-time" | "password";
  default?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  enum?: string[];
}

export interface NumberParameterObjectType
  extends NumberParameterObjectTypeBase {
  type: "number";
  format?: "float" | "double";
  default?: number;
}

export interface IntegerParameterObjectType
  extends NumberParameterObjectTypeBase {
  type: "integer";
  format?: "int32" | "int64";
  default?: number;
}

export interface BooleanParameterObjectType {
  type: "boolean";
  default?: boolean;
  enum?: boolean[];
}

export interface FileParameterObjectType {
  type: "file";
}

export interface ArrayParameterObjectType extends ArrayParameterObjectTypeBase {
  collectionFormat?: "csv" | "ssv" | "tsv" | "pipes";
}

export interface ArrayMultiParameterObjectType
  extends ArrayParameterObjectTypeBase {
  collectionFormat?: "csv" | "ssv" | "tsv" | "pipes" | "multi";
}

interface ArrayParameterObjectTypeBase {
  type: "array";
  items: ItemsObject;
  default?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
}

interface NumberParameterObjectTypeBase {
  default?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  enum?: number[];
  multipleOf?: number;
}

/**
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#itemsObject
 * The items object is similar enough to the header object to warrant use of the
 * `Exclude` utility type.
 */
export type ItemsObject = Exclude<HeaderObject, "description">;

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#definitionsObject
export interface DefinitionsObject {
  [name: string]: SchemaObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parametersDefinitionsObject
export interface ParametersDefinitionsObject {
  [name: string]: ParameterObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responsesDefinitionsObject
export interface ResponsesDefinitionsObject {
  [name: string]: ResponseObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityDefinitionsObject
export interface SecurityDefinitionsObject {
  [name: string]: SecuritySchemeObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securitySchemeObject
export type SecuritySchemeObject =
  | BasicSecuritySchemeObject
  | ApiKeySecuritySchemeObject
  | OAuth2SecuritySchemeObject;

export interface BasicSecuritySchemeObject extends SecuritySchemeObjectBase {
  type: "basic";
}

export interface ApiKeySecuritySchemeObject extends SecuritySchemeObjectBase {
  type: "apiKey";
  name: string;
  in: "query" | "header";
}

export type OAuth2SecuritySchemeObject =
  | ImplicitOAuth2SecuritySchemeObject
  | PasswordOAuth2SecuritySchemeObject
  | ApplicationOAuth2SecuritySchemeObject
  | AccessCodeOAuth2SecuritySchemeObject;

export interface ImplicitOAuth2SecuritySchemeObject
  extends OAuth2SecuritySchemeObjectBase,
    SecuritySchemeObjectBase {
  flow: "implicit";
  authorizationUrl: string;
}

export interface PasswordOAuth2SecuritySchemeObject
  extends OAuth2SecuritySchemeObjectBase,
    SecuritySchemeObjectBase {
  flow: "password";
  tokenUrl: string;
}

export interface ApplicationOAuth2SecuritySchemeObject
  extends OAuth2SecuritySchemeObjectBase,
    SecuritySchemeObjectBase {
  flow: "application";
  tokenUrl: string;
}

export interface AccessCodeOAuth2SecuritySchemeObject
  extends OAuth2SecuritySchemeObjectBase,
    SecuritySchemeObjectBase {
  flow: "accessCode";
  authorizationUrl: string;
  tokenUrl: string;
}

interface OAuth2SecuritySchemeObjectBase {
  type: "oauth2";
  scopes: ScopesObject;
}

interface SecuritySchemeObjectBase {
  description?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#scopesObject
export interface ScopesObject {
  [name: string]: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject
export interface SecurityRequirementObject {
  [name: string]: string[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject
export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#externalDocumentationObject
export interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject
export interface ExampleObject {
  [mimeType: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject
export type SchemaObject =
  | NumberSchemaObject
  | IntegerSchemaObject
  | StringSchemaObject
  | BooleanSchemaObject
  | ArraySchemaObject
  | ObjectSchemaObject
  | AnySchemaObject
  | AllOfSchemaObject
  | ReferenceSchemaObject;

interface SchemaObjectBase {
  /**
   * OpenAPI 2 does not support null types. We apply the commonly used
   * vendor extension `x-nullable` to describe nullability.
   *
   * See https://stackoverflow.com/a/48114322.
   */
  "x-nullable"?: boolean;
  title?: string;
  description?: string;
  example?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  externalDocs?: ExternalDocumentationObject;
}

export interface NumberSchemaObject
  extends SchemaObjectBase,
    NumberSchemaObjectBase {
  type: "number";
  format?: "float" | "double";
}

export interface IntegerSchemaObject
  extends SchemaObjectBase,
    NumberSchemaObjectBase {
  type: "integer";
  format?: "int32" | "int64";
}

interface NumberSchemaObjectBase {
  default?: number;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  enum?: (number | null)[];
}

export interface StringSchemaObject extends SchemaObjectBase {
  type: "string";
  default?: string;
  maxLength?: number;
  minLength?: number;
  /**
   * OpenAPI allows custom formats. We constrain the format here to those
   * that OpenAPI has defined and custom formats that Spot may produce.
   */
  format?: "date" | "date-time" | "password" | "byte" | "binary";
  pattern?: string;
  enum?: (string | null)[];
}

export interface BooleanSchemaObject extends SchemaObjectBase {
  type: "boolean";
  enum?: (boolean | null)[];
  default?: boolean;
}

export interface ArraySchemaObject extends SchemaObjectBase {
  type: "array";
  default?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  items: SchemaObject;
}

export interface ObjectSchemaObject extends SchemaObjectBase {
  type: "object";
  default?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  required?: string[];
  maxProperties?: number;
  minProperties?: number;
  properties?: ObjectPropertiesSchemaObject;
  additionalProperties?: SchemaObject | boolean;
}

export interface ObjectPropertiesSchemaObject {
  [name: string]: SchemaObject & ObjectPropertySchemaObjectBase;
}

interface ObjectPropertySchemaObjectBase {
  readOnly?: boolean;
  xml?: XmlObject;
}

export interface AnySchemaObject extends SchemaObjectBase {
  AnyValue: {};
}

export interface AllOfSchemaObject extends SchemaObjectBase {
  allOf: SchemaObject[];
  discriminator?: string;
}

export interface ReferenceSchemaObject {
  $ref: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#xmlObject
export interface XmlObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject
export interface ReferenceObject {
  $ref: string;
}

type Schemes = "http" | "https" | "ws" | "wss";
