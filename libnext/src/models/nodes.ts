import { HttpMethod } from "./http";
import { DataType } from "./types";
import { Locatable } from "./locatable";

export interface ContractNode {
  api: Locatable<ApiNode>;
  endpoints: Locatable<EndpointNode>[];
  types: TypeNode[];
}

export interface TypeNode {
  name: string;
  description?: string;
  type: DataType;
}

export interface ApiNode {
  name: Locatable<string>;
  description?: Locatable<string>;
}

export interface EndpointNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  tags?: Locatable<string[]>;
  method: Locatable<HttpMethod>;
  path: Locatable<string>;
  request?: Locatable<RequestNode>;
  responses: Locatable<ResponseNode>[];
  defaultResponse?: Locatable<DefaultResponseNode>;
}

export interface RequestNode {
  headers?: Locatable<Locatable<HeaderNode>[]>;
  pathParams?: Locatable<Locatable<PathParamNode>[]>;
  queryParams?: Locatable<Locatable<QueryParamNode>[]>;
  body?: Locatable<BodyNode>;
}

/** A response inherits all the properties of default response, as well as specifying a specific status code. */
export interface ResponseNode extends DefaultResponseNode {
  status: Locatable<number>;
}

/** The default response, is the assumed response when no status code is specified. */
export interface DefaultResponseNode {
  description?: Locatable<string>;
  headers?: Locatable<Locatable<HeaderNode>[]>;
  body?: Locatable<BodyNode>;
}

export interface HeaderNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  type: DataType;
  optional: boolean;
}

export interface PathParamNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  type: DataType;
}

export interface QueryParamNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  type: DataType;
  optional: boolean;
}

export interface BodyNode {
  description?: Locatable<string>;
  type: DataType;
}
