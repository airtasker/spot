import { String } from "../../lib";

export interface BaseError {
  error_code: String;
  error_messages: String[];
}

export interface UnprocessableEntityError extends BaseError {
  type: "unprocessable_entity";
}

export interface InternalServerError extends BaseError {
  type: "internal_server";
}

export interface Header {
  key: String;
  value: String;
}
