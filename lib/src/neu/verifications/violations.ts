import {
  PathParamTypeMismatch,
  QueryParamTypeMismatch,
  RequestBodyTypeMismatch,
  RequestHeaderTypeMismatch,
  RequiredQueryParamMissing,
  RequiredRequestHeaderMissing,
  RequiredResponseHeaderMissing,
  ResponseBodyTypeMismatch,
  ResponseHeaderTypeMismatch,
  UndefinedEndpoint,
  UndefinedEndpointResponse,
  UndefinedQueryParam,
  UndefinedRequestBody,
  UndefinedRequestHeader,
  UndefinedResponseBody,
  UndefinedResponseHeader
} from "../../validation-server/spots/validate";

export function undefinedEndpoint(message: string): UndefinedEndpoint {
  return {
    type: "undefined_endpoint",
    message
  };
}

export function undefinedEndpointResponse(
  message: string
): UndefinedEndpointResponse {
  return {
    type: "undefined_endpoint_response",
    message
  };
}

export function requiredRequestHeaderMissing(
  message: string
): RequiredRequestHeaderMissing {
  return {
    type: "required_request_header_missing",
    message
  };
}

export function undefinedRequestHeader(
  message: string
): UndefinedRequestHeader {
  return {
    type: "undefined_request_header",
    message
  };
}

export function requestHeaderTypeMismatch(
  message: string
): RequestHeaderTypeMismatch {
  return {
    type: "request_header_type_mismatch",
    message
  };
}

export function pathParamTypeMismatch(message: string): PathParamTypeMismatch {
  return {
    type: "path_param_type_mismatch",
    message
  };
}

export function requiredQueryParamMissing(
  message: string
): RequiredQueryParamMissing {
  return {
    type: "required_query_param_missing",
    message
  };
}

export function undefinedQueryParam(message: string): UndefinedQueryParam {
  return {
    type: "undefined_query_param",
    message
  };
}

export function queryParamTypeMismatch(
  message: string
): QueryParamTypeMismatch {
  return {
    type: "query_param_type_mismatch",
    message
  };
}

export function undefinedRequestBody(message: string): UndefinedRequestBody {
  return {
    type: "undefined_request_body",
    message
  };
}

export function requestBodyTypeMismatch(
  message: string
): RequestBodyTypeMismatch {
  return {
    type: "request_body_type_mismatch",
    message
  };
}

export function requiredResponseHeaderMissing(
  message: string
): RequiredResponseHeaderMissing {
  return {
    type: "required_response_header_missing",
    message
  };
}

export function undefinedResponseHeader(
  message: string
): UndefinedResponseHeader {
  return {
    type: "undefined_response_header",
    message
  };
}

export function responseHeaderTypeMismatch(
  message: string
): ResponseHeaderTypeMismatch {
  return {
    type: "response_header_type_mismatch",
    message
  };
}

export function undefinedResponseBody(message: string): UndefinedResponseBody {
  return {
    type: "undefined_response_body",
    message
  };
}

export function responseBodyTypeMismatch(
  message: string
): ResponseBodyTypeMismatch {
  return {
    type: "response_body_type_mismatch",
    message
  };
}
