import {
  api,
  defaultError,
  endpoint,
  pathParam,
  specificError
} from "../../../lib/src/lib";

@api()
export class Api {
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
  deleteUser(@pathParam userId: string): null {
    throw new Error("Not implemented");
  }
}
