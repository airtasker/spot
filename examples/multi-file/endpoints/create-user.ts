import { api, endpoint, pathParam, request } from "../../../src/lib";
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

  @endpoint({
    method: "GET",
    path: "/users/:userId"
  })
  getUser(
    @pathParam userId: string
  ): Promise<{
    name: string;
    age?: number;
  }> {
    throw new Error("Not implemented");
  }

  @endpoint({
    method: "DELETE",
    path: "/users/:userId"
  })
  deleteUser(@pathParam userId: string): void {
    throw new Error("Not implemented");
  }
}
