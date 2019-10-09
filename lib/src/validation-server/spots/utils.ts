import { String } from "../../lib";

export interface BaseError {
  error_code: String;
  error_messages: String[];
}

export interface UnprocessableEntityError extends BaseError {
  type: "unprocessable_entity";
}

export type Headers = String[];
