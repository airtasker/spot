import { HttpMethod } from "./http";
import {
  ObjectType,
  ObjectReferenceType,
  AliasablePrimitiveType,
  StringLikeType,
  NumberLikeType
} from "./types";

export interface Contract {
  api: ApiDefinition;
  endpoints: EndpointDefinition[];
  types: TypeDefinition[];
}

export interface TypeDefinition {
  description?: string;
  name: string;
  type: ObjectType | AliasablePrimitiveType;
}

export interface ApiDefinition {
  name: string;
  description?: string;
}

export interface EndpointDefinition {
  description?: string;
  method: HttpMethod;
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
  type: StringLikeType | NumberLikeType;
  optional: boolean;
}

export interface PathParamDefinition {
  description?: string;
  name: string;
  type: StringLikeType | NumberLikeType;
}

export interface QueryParamDefinition {
  description?: string;
  name: string;
  type: StringLikeType | NumberLikeType;
  optional: boolean;
}

export interface BodyDefinition {
  description?: string;
  type: ObjectType | ObjectReferenceType;
  optional: boolean;
}
