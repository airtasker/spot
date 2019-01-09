import { HttpMethod } from "./http";
import { DataType, ObjectType, ReferenceType } from "./types";

export interface Contract {
  api: ApiDefinition;
  endpoints: EndpointDefinition[];
}

export interface ApiDefinition {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  description?: string;
  method: HttpMethod;
  name: string;
  path: string;
  request?: RequestDefinition;
  responses: ResponseDefinition[];
}

export interface RequestDefinition {
  headers: HeaderDefinition[];
  pathParams: PathParamDefinition[];
  queryParams: QueryParamDefinition[];
  body?: BodyDefinition;
}

export interface ResponseDefinition {
  description?: string;
  status: number;
  headers: HeaderDefinition[];
  body?: BodyDefinition;
}

export interface HeaderDefinition {
  description?: string;
  name: string;
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
  type: ObjectType | ReferenceType;
  optional: boolean;
}
