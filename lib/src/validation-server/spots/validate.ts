import { body, endpoint, Integer, request, response, String } from "../../lib";
import { HttpMethod } from "../../models/http";
import { Header, UnprocessableEntityError } from "./utils";

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
}

export interface ValidateRequest {
  request: {
    method: HttpMethod;
    path: String;
    headers: Header[];
    body: String;
  };
  response: {
    status: Integer;
    headers: Header[];
    body: String;
  };
}

export interface ValidateResponse {
  mismatches: String[];
}
