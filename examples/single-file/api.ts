import { api, endpoint, pathParam, request } from "../../src/lib";

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

export interface CreaterUserRequest {
  name: string;
}

export type CreateUserResponse =
  | {
      success: false;
      errors: string[];
    }
  | {
      success: true;
      confirmation: string;
    };

export interface GetUserResponse {
  name: string;
}
