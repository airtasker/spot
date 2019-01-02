import { HttpMethod } from "./types";

export interface ApiDefinition {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  description?: string;
  method: HttpMethod;
  path: string;
  // request: RequestDefinition;
  // responses: ResponseDefinition;
}

export interface RequestDefinition {
  headers: HeaderDefinition[];
  pathParams: PathParamDefinition[];
  queryParams: QueryParamDefinition[];
  body: BodyDefinition;
}

export interface ResponseDefinition {
  description?: string;
  status: number;
  headers: HeaderDefinition[];
  body: BodyDefinition;
}

export interface HeaderDefinition {
  description?: string;
}

export interface PathParamDefinition {
  description?: string;
}

export interface QueryParamDefinition {
  description?: string;
}

export interface BodyDefinition {
  description?: string;
}
