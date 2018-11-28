import {
  api,
  endpoint,
  Float,
  genericError,
  header,
  Int32,
  Int64,
  Optional,
  pathParam,
  queryParam,
  request,
  specificError,
  response
} from "@airtasker/spot";

@api()
export class Api {
  @endpoint({
    method: "POST",
    path: "/users/create",
    description: "This is an endpoint to create a user",
    tags: ["users"]
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

  @endpoint({
    method: "GET",
    path: "/users",
    tags: ["users"]
  })
  findUsers(
    @queryParam({ description: "Limit number of returned results" })
    limit: Int32,
    @queryParam() search_term: Optional<string>
  ): Promise<
    {
      name: string;
      age?: Float;
    }[]
  > {
    return response();
  }

  @endpoint({
    method: "GET",
    path: "/users/:userId",
    tags: ["users"]
  })
  getUser(
    @pathParam({ description: "User unique identifier" }) userId: Int64
  ): Promise<{
    name: string;
    age?: Float;
  }> {
    return response();
  }

  @endpoint({
    method: "DELETE",
    path: "/users/:userId-confirmed",
    tags: ["users"]
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
    @pathParam() userId: Int64,
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
