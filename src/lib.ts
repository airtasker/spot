export function api<T>(description: ApiDescription = {}) {
  return (constructor: Function) => {};
}

export interface ApiDescription {}

export function endpoint<T>(description: EndpointDescription) {
  return (target: T, propertyKey: string, descriptor: PropertyDescriptor) => {};
}

export interface EndpointDescription {
  method: HttpMethod;
  path: string;
}

export function isHttpMethod(method: string): method is HttpMethod {
  switch (method) {
    case "GET":
    case "POST":
      return true;
    default:
      return false;
  }
}

export type HttpMethod = "GET" | "POST";

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
