export interface UserInputRequest {
  path: string;
  method: string;
  headers: UserInputHeader;
  body?: UserInputBody;
}

export interface UserInputResponse {
  headers: UserInputHeader;
  statusCode: number;
  body?: UserInputBody;
}

export type UserInput = UserInputRequest | UserInputResponse;

export interface UserInputHeader {
  [key: string]: string;
}
export type UserInputBody = unknown;

export type UserContent = UserInputBody | UserInputHeader;
