import {
  endpoint,
  genericError,
  header,
  pathParam,
  specificError,
  response,
  Int64
} from "@airtasker/spot";

export class DeleteUser {
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
    @pathParam() userId: Int64,
    @header({
      name: "Authorization"
    })
    authToken: string
  ): null {
    return response();
  }
}
