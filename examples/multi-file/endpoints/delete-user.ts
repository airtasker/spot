import { api, endpoint, pathParam } from "../../../src/lib";

@api()
export class Api {
  @endpoint({
    method: "DELETE",
    path: "/users/:userId"
  })
  deleteUser(@pathParam userId: string): void {
    throw new Error("Not implemented");
  }
}
