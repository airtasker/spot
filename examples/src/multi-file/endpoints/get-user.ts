import {
  api,
  endpoint,
  Float,
  Int64,
  pathParam,
  response
} from "@airtasker/spot";

@api()
export class Api {
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
}
