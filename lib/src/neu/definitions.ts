import { Type } from "./types";

export interface Contract {
  name: string;
  description?: string;
  types: Array<{ name: string; type: Type }>;
  security: Security;
  endpoints: Endpoint[];
}

export interface Security {
  header?: SecurityHeader;
}

export interface SecurityHeader {
  name: string;
  description?: string;
  type: Type;
}

export interface Endpoint {
  name: string;
  description?: string;
  tags: string[];
  method: HttpMethod;
  path: string;
  request?: Request;
  responses: Response[];
  defaultResponse?: DefaultResponse;
}

export interface Request {
  headers: Header[];
  pathParams: PathParam[];
  queryParams: QueryParam[];
  body?: Body;
}

export interface Response {
  status: number;
  description?: string;
  headers: Header[];
  body?: Body;
}

export type DefaultResponse = Omit<Response, "status">;

export interface Header {
  name: string;
  description?: string;
  type: Type;
  optional: boolean;
}

export interface PathParam {
  name: string;
  description?: string;
  type: Type;
}

export interface QueryParam {
  name: string;
  description?: string;
  type: Type;
  optional: boolean;
}

export interface Body {
  description?: string;
  type: Type;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
