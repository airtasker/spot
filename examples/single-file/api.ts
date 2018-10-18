import {
  api,
  defaultError,
  endpoint,
  header,
  pathParam,
  request,
  specificError
} from "../../lib/src/lib";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create"
  })
  createUser(@request req: CreateUserRequest): CreateUserResponse {
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
    path: "/users/:userId-confirmed"
  })
  @defaultError<{
    message: string;
  }>()
  @specificError<{
    message: string;
    signedInAs: string;
  }>({
    statusCode: 403
  })
  deleteUser(
    @pathParam userId: string,
    @header({
      name: "Authorization"
    })
    authToken: string
  ): null {
    throw new Error("Not implemented");
  }
}

export interface CreateUserRequest {
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
