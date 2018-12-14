import {
  endpoint,
  genericError,
  header,
  Int64,
  pathParam,
  response,
  specificError
} from "@airtasker/spot";
import { BaseError, ForbiddenError } from "../errors";

export class DeleteUser {
  @endpoint({
    method: "DELETE",
    path: "/users/:userId-confirmed",
    tags: ["users"]
  })
  @genericError<BaseError>()
  @specificError<ForbiddenError>({
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
