import { HttpMethod } from "./http";
import { DataExpression, DataType } from "./types";

export interface ContractDefinition {
  api: ApiDefinition;
  endpoints: EndpointDefinition[];
  types: TypeDefinition[];
}

export interface TypeDefinition {
  name: string;
  description?: string;
  type: DataType;
}

export interface ApiDefinition {
  name: string;
  description?: string;
  securityHeader?: SecurityHeaderDefinition;
}

export interface SecurityHeaderDefinition {
  name: string;
  description?: string;
  type: DataType;
}

export interface EndpointDefinition {
  name: string;
  description?: string;
  isDraft: boolean;
  tags: string[];
  method: HttpMethod;
  path: string;
  request: RequestDefinition;
  responses: ResponseDefinition[];
  defaultResponse?: DefaultResponseDefinition;
  tests: TestDefinition[];
}

export interface RequestDefinition {
  headers: HeaderDefinition[];
  pathParams: PathParamDefinition[];
  queryParams: QueryParamDefinition[];
  body?: BodyDefinition;
}

/** A response inherits all the properties of default response, as well as specifying a specific status code. */
export interface ResponseDefinition extends DefaultResponseDefinition {
  status: number;
}

/** The default response, is the assumed response when no status code is specified. */
export interface DefaultResponseDefinition {
  description?: string;
  headers: HeaderDefinition[];
  body?: BodyDefinition;
}

export interface HeaderDefinition {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface PathParamDefinition {
  name: string;
  description?: string;
  type: DataType;
}

export interface QueryParamDefinition {
  name: string;
  description?: string;
  type: DataType;
  optional: boolean;
}

export interface BodyDefinition {
  description?: string;
  type: DataType;
}

export interface TestDefinition {
  name: string;
  description?: string;
  states: TestStateDefinition[];
  request?: TestRequestDefinition;
  response: TestResponseDefinition;
}

export interface TestStateDefinition {
  name: string;
  params: Array<{ name: string; expression: DataExpression }>;
}

export interface TestRequestDefinition {
  headers: Array<{ name: string; expression: DataExpression }>;
  pathParams: Array<{
    name: string;
    expression: DataExpression;
  }>;
  queryParams: Array<{
    name: string;
    expression: DataExpression;
  }>;
  body?: DataExpression;
}

export interface TestResponseDefinition {
  status: number;
  headers: Array<{ name: string; expression: DataExpression }>;
  body?: DataExpression;
}
