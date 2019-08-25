import { BooleanType, Int32Type, Int64Type, StringType, Type } from "./types";

export interface Contract {
  name: string;
  description?: string;
  types: Type[];
  security: Security;
  endpoints: Endpoint[];
}

interface Security {
  header?: Header;
}

export interface Endpoint {
  name: string;
  description?: string;
  tags: string[];
  method: HttpMethod;
  path: string;
  request?: Request;
}

export interface Request {
  headers: Header[];
  pathParams: PathParam[];
  queryParams: QueryParam[];
  body?: Body;
}

export interface Header {
  name: string;
  description?: string;
  type: Type; // BooleanType | StringType | Int32Type | Int64Type; // TODO: reference types?
  optional: boolean;
}

export interface PathParam {
  name: string;
  description?: string;
  type: Type; // StringType | Int32Type | Int64Type; // TODO: reference types?
}

export interface QueryParam {
  name: string;
  description?: string;
  type: Type; // TODO: narrow tpye
  optional: boolean;
}

export interface Body {
  description?: string;
  type: Type;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
