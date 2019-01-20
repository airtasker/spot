import { HttpMethod } from "./http";
import { DataType } from "./types";

export interface ContractDefinition {
  api: ApiDefintiion;
  endpoints: EndpointDefinition[];
  types: TypeDefinition[];
}

export interface TypeDefinition {
  name: string;
  description?: string;
  type: DataType;
}

export interface ApiDefintiion {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  name: string;
  description?: string;
  tags: string[];
  method: HttpMethod;
  path: string;
  request: RequestDefinition;
  responses: ResponseDefinition[];
  defaultResponse?: DefaultResponseDefinition;
}

export interface RequestDefinition {
  headers: HeaderDefinition[];
  pathParams: PathParamDefinition[];
  queryParams: QueryParamDefinition[];
  body?: BodyDefinition;
}

/** A response inherits all the properties of default response, as well as specifying a specific status code. */
export interface ResponseDefinition extends DefaultResponseDefinition {
  status: number;
}

/** The default response, is the assumed response when no status code is specified. */
export interface DefaultResponseDefinition {
  description?: string;
  headers: HeaderDefinition[];
  body?: BodyDefinition;
}

export interface HeaderDefinition {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface PathParamDefinition {
  name: string;
  description?: string;
  type: DataType;
}

export interface QueryParamDefinition {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface BodyDefinition {
  description?: string;
  type: DataType;
}
