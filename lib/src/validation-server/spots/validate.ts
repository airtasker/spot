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
  | UndefinedEndpoint
  | UndefinedEndpointResponse
  | RequiredRequestHeaderMissing
  | UndefinedRequestHeader
  | RequestHeaderTypeMismatch
  | PathParamTypeMismatch
  | RequiredQueryParamMissing
  | UndefinedQueryParam
  | QueryParamTypeMismatch
  | UndefinedRequestBody
  | RequestBodyTypeMismatch
  | RequiredResponseHeaderMissing
  | UndefinedResponseHeader
  | ResponseHeaderTypeMismatch
  | UndefinedResponseBody
  | ResponseBodyTypeMismatch;

export interface ViolationBase {
  message: String;
}

export interface TypeViolationBase {
  type_violations: string[];
}

export interface UndefinedEndpoint extends ViolationBase {
  type: "undefined_endpoint";
}

export interface UndefinedEndpointResponse extends ViolationBase {
  type: "undefined_endpoint_response";
}

export interface RequiredRequestHeaderMissing extends ViolationBase {
  type: "required_request_header_missing";
}

export interface UndefinedRequestHeader extends ViolationBase {
  type: "undefined_request_header";
}

export interface RequestHeaderTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "request_header_type_mismatch";
}

export interface PathParamTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "path_param_type_mismatch";
}

export interface RequiredQueryParamMissing extends ViolationBase {
  type: "required_query_param_missing";
}

export interface UndefinedQueryParam extends ViolationBase {
  type: "undefined_query_param";
}

export interface QueryParamTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "query_param_type_mismatch";
}

export interface UndefinedRequestBody extends ViolationBase {
  type: "undefined_request_body";
}

export interface RequestBodyTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "request_body_type_mismatch";
}

export interface RequiredResponseHeaderMissing extends ViolationBase {
  type: "required_response_header_missing";
}

export interface UndefinedResponseHeader extends ViolationBase {
  type: "undefined_response_header";
}

export interface ResponseHeaderTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "response_header_type_mismatch";
}

export interface UndefinedResponseBody extends ViolationBase {
  type: "undefined_response_body";
}

export interface ResponseBodyTypeMismatch
  extends ViolationBase,
    TypeViolationBase {
  type: "response_body_type_mismatch";
}
