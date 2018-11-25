import {
  api,
  endpoint,
  header,
  Optional,
  request,
  response
} from "@zenclabs/spot";
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
      name: "Authorization",
      description: "This is the authorization token"
    })
    authToken: Optional<string>
  ): CreateUserResponse {
    return response();
  }
}
