import { HttpMethod } from "./http";
import { Locatable } from "./locatable";
import { DataExpression, DataType, ParamSerializationStrategy } from "./types";

export interface ContractNode {
  api: Locatable<ApiNode>;
  config?: Locatable<ConfigNode>;
  endpoints: Array<Locatable<EndpointNode>>;
  types: TypeNode[];
}

export interface TypeNode<T extends DataType = DataType> {
  name: string;
  description?: string;
  type: T;
}

export interface ApiNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  securityHeader?: Locatable<SecurityHeaderNode>;
}

export interface ConfigNode {
  paramSerializationStrategy: ParamSerializationStrategy;
}

export interface SecurityHeaderNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  type: DataType;
}

export interface EndpointNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  isDraft: boolean;
  tags?: Locatable<string[]>;
  method: Locatable<HttpMethod>;
  path: Locatable<string>;
  request?: Locatable<RequestNode>;
  responses: Array<Locatable<ResponseNode>>;
  defaultResponse?: Locatable<DefaultResponseNode>;
  tests: Array<Locatable<TestNode>>;
}

export interface RequestNode {
  headers?: Locatable<Array<Locatable<HeaderNode>>>;
  pathParams?: Locatable<Array<Locatable<PathParamNode>>>;
  queryParams?: Locatable<Array<Locatable<QueryParamNode>>>;
  body?: Locatable<BodyNode>;
}

/** A response inherits all the properties of default response, as well as specifying a specific status code. */
export interface ResponseNode extends DefaultResponseNode {
  status: Locatable<number>;
}

/** The default response, is the assumed response when no status code is specified. */
export interface DefaultResponseNode {
  description?: Locatable<string>;
  headers?: Locatable<Array<Locatable<HeaderNode>>>;
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

export interface TestNode {
  name: Locatable<string>;
  description?: Locatable<string>;
  states?: TestStateNode[];
  request?: Locatable<TestRequestNode>;
  response: Locatable<TestResponseNode>;
  options: {
    allowInvalidRequest: boolean;
  };
}

export interface TestStateNode {
  name: string;
  params?: AttributeExpression[];
}

export interface TestRequestNode {
  headers?: AttributeExpression[];
  pathParams?: AttributeExpression[];
  queryParams?: AttributeExpression[];
  body?: DataExpression;
}

export interface TestResponseNode {
  status: Locatable<number>;
  headers?: AttributeExpression[];
  body?: DataExpression;
}

export interface AttributeExpression {
  name: string;
  expression: DataExpression;
}
