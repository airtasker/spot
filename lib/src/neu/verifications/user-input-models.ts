import { HttpMethod } from "../definitions";
import { Type } from "../types";

export interface UserInputRequest {
  path: string;
  method: HttpMethod;
  headers: string;
  body: UserInputBody;
  pathParams: string;
  queryParams: string;
}

export interface UserInputResponse {
  headers: string;
  statusCode: string;
  body: UserInputBody;
}

export interface UserInputBody {
  type: Type;
}
