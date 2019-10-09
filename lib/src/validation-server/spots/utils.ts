import { String } from "../../lib";

export interface UnprocessableEntityError {
  error_code: String;
  error_messages: String[];
}

export type Headers = String[];
