import { api, endpoint, error, pathParam } from "../../../src/lib";

@api()
export class Api {
  @endpoint({
    method: "DELETE",
    path: "/users/:userId-confirmed"
  })
  @error<{
    message: string;
  }>()
  @error<{
    message: string;
    signedInAs: string;
  }>({
    statusCode: 403
  })
  deleteUser(@pathParam userId: string): void {
    throw new Error("Not implemented");
  }
}
