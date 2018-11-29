import { endpoint, Float, Int64, pathParam, response } from "@airtasker/spot";

export class GetUser {
  @endpoint({
    method: "GET",
    path: "/users/:userId"
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
