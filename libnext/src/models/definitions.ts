import { HttpMethod } from "./http";
import { DataType } from "./types";

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
  name: string;
  path: string;
  request?: ParsedRequest;
  responses: ParsedResponse[];
  defaultResponse?: ParsedDefaultResponse; // TODO: should a default response be a requirement?
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
  description?: string;
  name: string;
  type: DataType;
  optional: boolean;
}

export interface ParsedPathParam {
  description?: string;
  name: string;
  type: DataType;
}

export interface ParsedQueryParam {
  description?: string;
  name: string;
  type: DataType;
  optional: boolean;
}

export interface ParsedBody {
  description?: string;
  type: DataType;
  optional: boolean;
}
