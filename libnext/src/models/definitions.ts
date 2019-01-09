import { HttpMethod } from "./http";
import {
  ObjectType,
  DataType,
  StringLikeType,
  NumberLikeType,
  ReferenceType
} from "./types";

export interface ParsedContract {
  api: ParsedApi;
  endpoints: ParsedEndpoint[];
  types: ParsedType[];
}

export interface ParsedType {
  description?: string;
  name: string;
  type: DataType;
}

export interface ParsedApi {
  name: string;
  description?: string;
}

export interface ParsedEndpoint {
  description?: string;
  method: HttpMethod;
  path: string;
  request?: ParsedRequest;
  responses: ParsedResponse[];
}

export interface ParsedRequest {
  headers: ParsedHeader[];
  pathParams: ParsedPathParam[];
  queryParams: ParsedQueryParam[];
  body?: ParsedBody;
}

export interface ParsedResponse {
  description?: string;
  status: number;
  headers: ParsedHeader[];
  body?: ParsedBody;
}

export interface ParsedHeader {
  description?: string;
  name: string;
  type: StringLikeType | NumberLikeType;
  optional: boolean;
}

export interface ParsedPathParam {
  description?: string;
  name: string;
  type: StringLikeType | NumberLikeType;
}

export interface ParsedQueryParam {
  description?: string;
  name: string;
  type: StringLikeType | NumberLikeType;
  optional: boolean;
}

export interface ParsedBody {
  description?: string;
  type: ObjectType | ReferenceType;
  optional: boolean;
}
