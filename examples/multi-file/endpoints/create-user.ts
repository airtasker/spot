import { api, endpoint, request } from "../../../lib/src/lib";
import { CreateUserRequest, CreateUserResponse } from "../models";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create"
  })
  createUser(@request req: CreateUserRequest): CreateUserResponse {
    throw new Error("Not implemented");
  }
}
