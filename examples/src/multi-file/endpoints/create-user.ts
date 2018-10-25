import { api, endpoint, header, Optional, request } from "@zenclabs/api";
import { CreateUserRequest, CreateUserResponse } from "../models";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create"
  })
  createUser(
    @request req: CreateUserRequest,
    @header({
      name: "Authorization"
    })
    authToken: Optional<string>
  ): CreateUserResponse {
    throw new Error("Not implemented");
  }
}
