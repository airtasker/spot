import { Type, TypeDef } from "./types";

export interface Contract {
  name: string;
  description?: string;
  version?: string;
  config: Config;
  types: { name: string; typeDef: TypeDef }[];
  security?: SecurityHeader;
  endpoints: Endpoint[];
  oa3servers?: Oa3Server[];
}

export interface Config {
  paramSerializationStrategy: {
    query: {
      array: QueryParamArrayStrategy;
    };
  };
}

export interface SecurityHeader {
  name: string;
  description?: string;
  type: Type;
}

export interface Endpoint {
  name: string;
  description?: string;
  summary?: string;
  tags: string[];
  method: HttpMethod;
  path: string;
  request?: Request;
  responses: Response[];
  defaultResponse?: DefaultResponse;
  draft: boolean;
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
  examples?: Example[];
}

export interface PathParam {
  name: string;
  description?: string;
  type: Type;
  examples?: Example[];
}

export interface Example {
  name: string;
  value: any; // TODO: encapsulate type information
}

export interface QueryParam {
  name: string;
  description?: string;
  type: Type;
  optional: boolean;
  examples?: Example[];
}

export interface Body {
  type: Type;
}

export interface Oa3Server {
  url: string;
  description?: string;
  oa3ServerVariables: Oa3ServerVariable[];
}

export interface Oa3ServerVariable {
  type: Type;
  description?: string;
  defaultValue: string;
  parameterName: string;
}

/**
 * Supported serialization strategies for arrays in query parameters
 *
 *    "ampersand": ?id=3&id=4&id=5
 *    "comma": ?id=3,4,5
 */
export type QueryParamArrayStrategy = "ampersand" | "comma";

/** Supported HTTP methods */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

/** Type guards */
export function isSpecificResponse(
  response: DefaultResponse
): response is Response {
  return "status" in response;
}
