import { Contract } from "../../definitions";

function generateOpenAPI3(contract: Contract): OpenApiV3 {
  const openapi: OpenApiV3 = {
    openapi: "3.0.2",
    info: {
      title: "some title",
      version: "0.0.0"
    },
    paths: {}
  };

  return openapi;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object
interface OpenApiV3 {
  openapi: "3.0.2";
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#info-object
interface InfoObject {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  version: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#contact-object
interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#license-object
interface LicenseObject {
  name: string;
  url?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#server-object
interface ServerObject {
  url: string;
  description?: string;
  variables?: { [serverVariable: string]: ServerVariableObject };
}

// https://github.com/OAI/OpenAPI-Specification/blob/3.0.2/versions/3.0.2.md#serverVariableObject
interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathsObject
interface PathsObject {
  [path: string]: PathItemObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
interface PathItemObject {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  servers?: ServerObject[];
  parameters: Array<ParameterObject | ReferenceObject>;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#operationObject
interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
  operationId?: string;
  parameters?: Array<ParameterObject | ReferenceObject>;
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  callbacks?: { [callback: string]: CallbackObject | ReferenceObject };
  deprecated?: boolean;
  security: SecurityRequirementObject[];
  servers: ServerObject[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#referenceObject
interface ReferenceObject {
  $ref: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#requestBodyObject
interface RequestBodyObject {
  description?: string;
  content: { [mediaType: string]: MediaTypeObject };
  required: boolean;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#mediaTypeObject
interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: { [example: string]: ExampleObject | ReferenceObject };
  encoding?: { [encoding: string]: EncodingObject };
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject
interface SchemaObject {
  nullable?: boolean;
  discriminator?: DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlObject;
  externalDocs?: ExternalDocumentationObject;
  example?: any;
  deprecated?: boolean;

  type?: string;
  allOf?: Array<SchemaObject | ReferenceObject>;
  oneOf?: Array<SchemaObject | ReferenceObject>;
  anyOf?: Array<SchemaObject | ReferenceObject>;
  not?: SchemaObject | ReferenceObject;
  items?: SchemaObject | ReferenceObject;
  properties?: { [propertyName: string]: SchemaObject | ReferenceObject };
  additionalProperties?: SchemaObject | ReferenceObject | boolean;
  description?: string;
  format?: string;
  default?: any;

  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#discriminatorObject
interface DiscriminatorObject {
  propertyName: string;
  mapping?: { [key: string]: string };
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#securitySchemeObject
type SecuritySchemeObject =
  | ApiKeySecuritySchemeObject
  | HttpSecuritySchemeObject
  | OAuth2SecuritySchemeObject
  | OpenIdConnectSecuritySchemeObject;

interface ApiKeySecuritySchemeObject extends SecuritySchemeObjectBase {
  name: string;
  in: "query" | "header" | "cookie";
}

interface HttpSecuritySchemeObject extends SecuritySchemeObjectBase {
  scheme: string;
  bearerFormat?: string;
}

interface OAuth2SecuritySchemeObject extends SecuritySchemeObjectBase {
  flows?: OAuthFlowsObject;
}

interface OpenIdConnectSecuritySchemeObject extends SecuritySchemeObjectBase {
  openIdConnectUrl?: string;
}

interface SecuritySchemeObjectBase {
  type: SecuritySchemeType;
  description?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauthFlowsObject
interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauthFlowObject
interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [scope: string]: string };
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#securityRequirementObject
interface SecurityRequirementObject {
  [name: string]: string[];
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#componentsObject
interface ComponentsObject {
  schemas?: { [schema: string]: SchemaObject | ReferenceObject };
  responses?: { [response: string]: ResponseObject | ReferenceObject };
  parameters?: { [parameter: string]: ParameterObject | ReferenceObject };
  examples?: { [example: string]: ExampleObject | ReferenceObject };
  requestBodies?: { [request: string]: RequestBodyObject | ReferenceObject };
  headers?: { [header: string]: HeaderObject | ReferenceObject };
  securitySchemes?: {
    [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
  };
  links?: { [link: string]: LinkObject | ReferenceObject };
  callbacks?: { [callback: string]: CallbackObject | ReferenceObject };
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#xmlObject
interface XmlObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject
interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#encoding-object
interface EncodingObject {
  contentType?: string;
  headers?: { [name: string]: HeaderObject | ReferenceObject };
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responsesObject
interface ResponsesObject {
  [statusCodeOrDefault: string]: ResponseObject | ReferenceObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responseObject
interface ResponseObject {
  description: string;
  headers?: { [name: string]: HeaderObject | ReferenceObject };
  content?: { [mediaType: string]: MediaTypeObject };
  links?: { [link: string]: LinkObject | ReferenceObject };
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
interface ParameterObject extends ParameterObjectBase {
  name: string;
  in: "query" | "header" | "path" | "cookie";
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#headerObject
type HeaderObject = ParameterObjectBase;

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#callbackObject
interface CallbackObject {
  [name: string]: PathItemObject;
}

interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: { [name: string]: any };
  requestBody?: any;
  description?: string;
  server?: ServerObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#tagObject
interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#externalDocumentationObject
interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

interface ParameterObjectBase {
  description?: string;
  required?: boolean; // must be true for "path"
  deprecated?: boolean;
  allowEmptyValue?: boolean;

  style?: ParameterStyle;
  explode?: boolean;
  allowReserved?: boolean;
  schema: SchemaObject | ReferenceObject;
  example: any;
  examples: { [example: string]: ExampleObject | ReferenceObject };
}

type ParameterStyle =
  | "matrix"
  | "label"
  | "form"
  | "simple"
  | "spaceDelimited"
  | "pipeDelimited"
  | "deepObject";

type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect";
