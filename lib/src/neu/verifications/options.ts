enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "DELETE",
  PATCH = "patch",
  HEAD = "head",
  CONNECT = "connect",
  OPTIONS = "options",
  TRACE = "trace"
}

export interface Options {
  url: string;
  method: HttpMethod;
  status: string;
  body: string;
  requestParameters: string;
  headers: string;
}
