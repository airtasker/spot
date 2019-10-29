export interface UserInputRequest {
  path: string;
  method: string;
  headers: UserInputHeader[];
  body?: UserInputBody;
}

export interface UserInputResponse {
  headers: UserInputHeader[];
  statusCode: number;
  body?: UserInputBody;
}

export interface UserInputHeader {
  name: string;
  value: string;
}

export type UserInputBody = unknown;
