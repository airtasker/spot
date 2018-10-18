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
}

export function error<T>(description: ErrorDescription = {}) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {};
}

export interface ErrorDescription {
  statusCode?: number;
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

export function request<T>(
  target: T,
  propertyKey: string,
  parameterIndex: number
) {}

export function pathParam<T>(
  target: T,
  propertyKey: string,
  parameterIndex: number
) {}
