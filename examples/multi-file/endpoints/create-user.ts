import { api, endpoint, request } from "../../../src/lib";
import { CreaterUserRequest, CreateUserResponse } from "../models";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create"
  })
  createUser(@request req: CreaterUserRequest): CreateUserResponse {
    throw new Error("Not implemented");
  }
}
