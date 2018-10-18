import { api, endpoint, pathParam } from "../../../lib/src/lib";

@api()
export class Api {
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
}
