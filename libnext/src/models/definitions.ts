import { HttpMethod } from "./http";
import { DataType } from "./types";

export interface ApiDefinition {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  description?: string;
  method: HttpMethod;
  path: string;
  // request?: RequestDefinition;
  // responses: ResponseDefinition[] // at least one;
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
  type: DataType;
  optional: boolean;
}

export interface PathParamDefinition {
  description?: string;
  name: string;
  type: DataType;
}

export interface QueryParamDefinition {
  description?: string;
  name: string;
  type: DataType;
  optional: boolean;
}

export interface BodyDefinition {
  description?: string;
}
