/**
 * Violations are used as part of the validation server payload to
 * express contract violations.
 */

import {
  PathParamTypeDisparityViolation,
  QueryParamTypeDisparityViolation,
  RequestBodyTypeDisparityViolation,
  RequestHeaderTypeDisparityViolation,
  RequiredQueryParamMissingViolation,
  RequiredRequestHeaderMissingViolation,
  RequiredResponseHeaderMissingViolation,
  ResponseBodyTypeDisparityViolation,
  ResponseHeaderTypeDisparityViolation,
  UndefinedEndpointResponseViolation,
  UndefinedEndpointViolation,
  UndefinedQueryParamViolation,
  UndefinedRequestBodyViolation,
  UndefinedRequestHeaderViolation,
  UndefinedResponseBodyViolation,
  UndefinedResponseHeaderViolation
} from "../spots/validate";

export function undefinedEndpointViolation(
  message: string
): UndefinedEndpointViolation {
  return { type: "undefined_endpoint", message };
}

export function undefinedEndpointResponseViolation(
  message: string
): UndefinedEndpointResponseViolation {
  return { type: "undefined_endpoint_response", message };
}

export function requiredRequestHeaderMissingViolation(
  message: string
): RequiredRequestHeaderMissingViolation {
  return { type: "required_request_header_missing", message };
}

export function undefinedRequestHeaderViolation(
  message: string
): UndefinedRequestHeaderViolation {
  return { type: "undefined_request_header", message };
}

export function requestHeaderTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): RequestHeaderTypeDisparityViolation {
  return {
    type: "request_header_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}

export function pathParamTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): PathParamTypeDisparityViolation {
  return {
    type: "path_param_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}

export function requiredQueryParamMissingViolation(
  message: string
): RequiredQueryParamMissingViolation {
  return { type: "required_query_param_missing", message };
}

export function undefinedQueryParamViolation(
  message: string
): UndefinedQueryParamViolation {
  return { type: "undefined_query_param", message };
}

export function queryParamTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): QueryParamTypeDisparityViolation {
  return {
    type: "query_param_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}

export function undefinedRequestBodyViolation(
  message: string
): UndefinedRequestBodyViolation {
  return { type: "undefined_request_body", message };
}

export function requestBodyTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): RequestBodyTypeDisparityViolation {
  return {
    type: "request_body_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}

export function requiredResponseHeaderMissingViolation(
  message: string
): RequiredResponseHeaderMissingViolation {
  return { type: "required_response_header_missing", message };
}

export function undefinedResponseHeaderViolation(
  message: string
): UndefinedResponseHeaderViolation {
  return { type: "undefined_response_header", message };
}

export function responseHeaderTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): ResponseHeaderTypeDisparityViolation {
  return {
    type: "response_header_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}

export function undefinedResponseBodyViolation(
  message: string
): UndefinedResponseBodyViolation {
  return { type: "undefined_response_body", message };
}

export function responseBodyTypeDisparityViolation(
  message: string,
  typeDisparities: string[]
): ResponseBodyTypeDisparityViolation {
  return {
    type: "response_body_type_disparity",
    message,
    type_disparities: typeDisparities
  };
}
