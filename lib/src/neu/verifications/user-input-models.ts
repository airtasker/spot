export interface UserInputRequest {
  path: string;
  method: string;
  headers: UserInputHeader;
  body: UserInputBody;
  pathParams: string;
  queryParams: string;
}

export interface UserInputResponse {
  headers: UserInputHeader;
  statusCode: number;
  body: UserInputBody;
}

export type UserInput = UserInputRequest | UserInputResponse;

export type UserInputHeader = unknown;
export type UserInputBody = unknown;
