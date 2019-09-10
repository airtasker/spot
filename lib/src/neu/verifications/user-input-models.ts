import { HttpMethod } from "../definitions";

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
  statusCode: number;
  body: UserInputBody;
}

export type UserInput = UserInputRequest | UserInputResponse;

export type UserInputBody = unknown;
