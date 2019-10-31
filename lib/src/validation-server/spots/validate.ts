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
  mismatches: String[];
}
