import { body, endpoint, Integer, request, response, String } from "../../lib";
import { HttpMethod } from "../../models/http";
import { Header, InternalServerError, UnprocessableEntityError } from "./utils";

@endpoint({
  method: "POST",
  path: "/validate"
})
export class Validate {
  @request
  request(@body body: ValidateRequest) {}

  @response({ status: 200 })
  response(@body body: ValidateResponse) {}

  @response({ status: 422 })
  unprocessableEntityError(@body body: UnprocessableEntityError) {}

  @response({ status: 500 })
  internalServerError(@body body: InternalServerError) {}
}

export interface RecordedRequest {
  method: HttpMethod;
  path: String;
  headers: Header[];
  body?: String;
}

export interface RecordedResponse {
  status: Integer;
  headers: Header[];
  body?: String;
}

export interface ValidateRequest {
  request: RecordedRequest;
  response: RecordedResponse;
}

export interface ValidateResponse {
  interaction: ValidateRequest;
  endpoint: String;
  violations: Violation[];
}

export type Violation =
  | UndefinedEndpointViolation
  | UndefinedEndpointResponseViolation
  | RequiredRequestHeaderMissingViolation
  | UndefinedRequestHeaderViolation
  | RequestHeaderTypeDisparityViolation
  | PathParamTypeDisparityViolation
  | RequiredQueryParamMissingViolation
  | UndefinedQueryParamViolation
  | QueryParamTypeDisparityViolation
  | UndefinedRequestBodyViolation
  | RequestBodyTypeDisparityViolation
  | RequiredResponseHeaderMissingViolation
  | UndefinedResponseHeaderViolation
  | ResponseHeaderTypeDisparityViolation
  | UndefinedResponseBodyViolation
  | ResponseBodyTypeDisparityViolation;

export interface ViolationBase {
  message: String;
}

export interface TypeViolationBase {
  type_disparities: string[];
}

export interface UndefinedEndpointViolation extends ViolationBase {
  type: "undefined_endpoint";
}

export interface UndefinedEndpointResponseViolation extends ViolationBase {
  type: "undefined_endpoint_response";
}

export interface RequiredRequestHeaderMissingViolation extends ViolationBase {
  type: "required_request_header_missing";
}

export interface UndefinedRequestHeaderViolation extends ViolationBase {
  type: "undefined_request_header";
}

export interface RequestHeaderTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "request_header_type_disparity";
}

export interface PathParamTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "path_param_type_disparity";
}

export interface RequiredQueryParamMissingViolation extends ViolationBase {
  type: "required_query_param_missing";
}

export interface UndefinedQueryParamViolation extends ViolationBase {
  type: "undefined_query_param";
}

export interface QueryParamTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "query_param_type_disparity";
}

export interface UndefinedRequestBodyViolation extends ViolationBase {
  type: "undefined_request_body";
}

export interface RequestBodyTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "request_body_type_disparity";
}

export interface RequiredResponseHeaderMissingViolation extends ViolationBase {
  type: "required_response_header_missing";
}

export interface UndefinedResponseHeaderViolation extends ViolationBase {
  type: "undefined_response_header";
}

export interface ResponseHeaderTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "response_header_type_disparity";
}

export interface UndefinedResponseBodyViolation extends ViolationBase {
  type: "undefined_response_body";
}

export interface ResponseBodyTypeDisparityViolation
  extends ViolationBase,
    TypeViolationBase {
  type: "response_body_type_disparity";
}
