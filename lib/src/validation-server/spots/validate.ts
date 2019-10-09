import { body, endpoint, Integer, request, response, String } from "../../lib";
import { HttpMethod } from "../../models/http";
import { Headers, UnprocessableEntityError } from "./utils";

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
    headers: Headers;
    body: String;
  };
  response: {
    status: {
      code: Integer;
    };
    headers: Headers;
    body: String;
  };
}

export interface ValidateResponse {
  mismatches: String[];
}
