import {
  api,
  endpoint,
  genericError,
  header,
  Optional,
  pathParam,
  queryParam,
  request,
  specificError,
  response
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
    return response();
  }

  @endpoint({
    method: "GET",
    path: "/users"
  })
  findUsers(
    @queryParam limit: number,
    @queryParam search_term: Optional<string>
  ): Promise<
    {
      name: string;
      age?: number;
    }[]
  > {
    return response();
  }

  @endpoint({
    method: "GET",
    path: "/users/:userId"
  })
  getUser(
    @pathParam({ description: "User unique identifier" }) userId: string
  ): Promise<{
    name: string;
    age?: number;
  }> {
    return response();
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
    @pathParam() userId: string,
    @header({
      name: "Authorization"
    })
    authToken: string
  ): null {
    return response();
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
