import { endpoint, Float, Int64, pathParam, response } from "@airtasker/spot";

export class GetUser {
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
