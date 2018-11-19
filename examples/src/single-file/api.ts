import {
  api,
  endpoint,
  genericError,
  header,
  Optional,
  pathParam, queryParam,
  request,
  specificError
} from "@zenclabs/spot";

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

  @endpoint({
    method: "GET",
    path: "/users"
  })
  getUsers(
    @queryParam() limit: number
  ): Promise<{
    name: string;
    age?: number;
  }[]> {
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
  @genericError<{
    message: string;
  }>()
  @specificError<{
    message: string;
    signedInAs: string;
  }>({
    name: "forbidden",
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

export interface CreateUserResponse {
  success: boolean;
}

export interface GetUserResponse {
  name: string;
}
