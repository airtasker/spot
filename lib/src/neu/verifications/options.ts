import { HttpMethod } from "../definitions";
import { Type } from "../types";

export interface Options {
  path: string;
  method: HttpMethod;
  statusCode: number;
  body: UserInputBody;
  requestParameters: string;
  headers: string;
}

export interface UserInputBody {
  type: Type;
}
