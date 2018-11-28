export function api(description: ApiDescription = {}) {
  return (constructor: Function) => {};
}

export interface ApiDescription {}

export function endpoint(description: EndpointDescription) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {};
}

export interface EndpointDescription {
  method: HttpMethod;
  path: string;
  description?: string;
  requestContentType?: HttpContentType;
  successStatusCode?: number;
  tags?: string[];
}

export function genericError<T>() {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {};
}

export function specificError<T>(description: ErrorDescription) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {};
}

export interface ErrorDescription {
  name: string;
  statusCode: number;
}

export function isHttpMethod(method: string): method is HttpMethod {
  switch (method) {
    case "GET":
    case "HEAD":
    case "POST":
    case "PUT":
    case "DELETE":
    case "CONNECT":
    case "OPTIONS":
    case "TRACE":
    case "PATCH":
      return true;
    default:
      return false;
  }
}

export function isHttpContentType(
  contentType: string
): contentType is HttpContentType {
  switch (contentType) {
    case "application/json":
    case "text/html":
      return true;
    default:
      return false;
  }
}

export type HttpContentType = "application/json" | "text/html";

export type HttpMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export function request(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {}

export function pathParam(description?: PathDescription) {
  return (target: any, propertyKey: string, parameterIndex: number) => {};
}

export interface PathDescription {
  description: string;
}

export function queryParam(description?: QueryParamDescription) {
  return (target: any, propertyKey: string, parameterIndex: number) => {};
}

export interface QueryParamDescription {
  description: string;
}

export function header(description: HeaderDescription) {
  return (target: any, propertyKey: string, parameterIndex: number) => {};
}

export interface HeaderDescription {
  name: string;
  description?: string;
}

export function response<T>(): T {
  throw "This is just a dummy response. The API contract is not evaluated at run-time.";
}

export type Int32 = number;
export type Int64 = number;
export type Float = number;
export type Double = number;

export type Optional<T> = T | void;
