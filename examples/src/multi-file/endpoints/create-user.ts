import { endpoint, header, Optional, request, response } from "@airtasker/spot";
import { CreateUserRequest, CreateUserResponse } from "../models";

export class CreateUser {
  @endpoint({
    method: "POST",
    path: "/users/create",
    description: "This is an endpoint to create a user"
  })
  createUser(
    @request req: CreateUserRequest,
    @header({
      name: "Authorization",
      description: "This is the authorization token"
    })
    authToken: Optional<string>
  ): CreateUserResponse {
    return response();
  }
}
