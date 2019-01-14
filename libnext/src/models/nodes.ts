import { HttpMethod } from "./http";
import { DataType } from "./types";

export interface ContractNode {
  api: ApiNode;
  endpoints: EndpointNode[];
  types: TypeNode[];
}

export interface TypeNode {
  name: string;
  description?: string;
  type: DataType;
}

export interface ApiNode {
  name: string;
  description?: string;
}

export interface EndpointNode {
  name: string;
  description?: string;
  method: HttpMethod;
  path: string;
  request?: RequestNode;
  responses: ResponseNode[];
  defaultResponse?: DefaultResponseNode;
}

export interface RequestNode {
  headers: HeaderNode[];
  pathParams: PathParamNode[];
  queryParams: QueryParamNode[];
  body?: BodyNode;
}

/** A response inherits all the properties of default response, as well as specifying a specific status code. */
export interface ResponseNode extends DefaultResponseNode {
  status: number;
}

/** The default response, is the assumed response when no status code is specified. */
export interface DefaultResponseNode {
  description?: string;
  headers: HeaderNode[];
  body?: BodyNode;
}

export interface HeaderNode {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface PathParamNode {
  name: string;
  description?: string;
  type: DataType;
}

export interface QueryParamNode {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface BodyNode {
  description?: string;
  type: DataType;
  optional: boolean;
}
