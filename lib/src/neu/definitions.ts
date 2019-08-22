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

interface Request {
  headers: Header[];
  pathParams: PathParam[];
  queryParams: QueryParam[];
  body: Body;
}

interface Header {
  name: string;
  description?: string;
  type: BooleanType | StringType | Int32Type | Int64Type; // TODO: reference types?
  optional: boolean;
}

interface PathParam {
  name: string;
  description?: string;
  type: StringType | Int32Type | Int64Type; // TODO: reference types?
}

interface QueryParam {
  name: string;
  description?: string;
  type: Type; // TODO: narrow tpye
  optional: boolean;
}

interface Body {
  description?: string;
  type: Type;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
