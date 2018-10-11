import { api, endpoint, pathParam, request } from "../src/lib";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create"
  })
  createUser(@request req: CreaterUserRequest): Promise<CreateUserResponse> {
    return Promise.reject();
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
    return Promise.reject();
  }
}

export interface CreaterUserRequest {
  name: string;
}

export interface CreateUserResponse {
  success: boolean;
}

export interface GetUserResponse {
  name: string;
}
