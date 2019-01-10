import { HttpMethod } from "./http";
import { DataType } from "./types";

export interface ParsedContract {
  api: ParsedApi;
  endpoints: ParsedEndpoint[];
  types: ParsedType[];
}

export interface ParsedType {
  name: string;
  description?: string;
  type: DataType;
}

export interface ParsedApi {
  name: string;
  description?: string;
}

export interface ParsedEndpoint {
  name: string;
  description?: string;
  method: HttpMethod;
  path: string;
  request?: ParsedRequest;
  responses: ParsedResponse[];
  defaultResponse?: ParsedDefaultResponse;
}

export interface ParsedRequest {
  headers: ParsedHeader[];
  pathParams: ParsedPathParam[];
  queryParams: ParsedQueryParam[];
  body?: ParsedBody;
}

export interface ParsedResponse extends ParsedDefaultResponse {
  status: number;
}

export interface ParsedDefaultResponse {
  description?: string;
  headers: ParsedHeader[];
  body?: ParsedBody;
}

export interface ParsedHeader {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface ParsedPathParam {
  name: string;
  description?: string;
  type: DataType;
}

export interface ParsedQueryParam {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface ParsedBody {
  description?: string;
  type: DataType;
  optional: boolean;
}
