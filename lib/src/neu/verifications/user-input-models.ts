export interface UserInputRequest {
  path: string;
  method: string;
  headers: UserInputHeader[];
  body?: UserInputBody;
}

export interface UserInputResponse {
  headers: UserInputHeaders;
  statusCode: number;
  body?: UserInputBody;
}

export type UserInput = UserInputRequest | UserInputResponse;

export interface UserInputHeader {
  name: string;
  value: string;
}

export interface UserInputHeaders {
  [key: string]: string;
}
export type UserInputBody = unknown;

export type UserContent = UserInputBody | UserInputHeaders;
