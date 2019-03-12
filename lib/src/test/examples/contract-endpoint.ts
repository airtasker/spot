import {
  body,
  endpoint,
  headers,
  pathParams,
  queryParams,
  request,
  response,
  test
} from "@airtasker/spot";
import { ErrorBody, UserBody } from "./models";

/** Retrieves a user in a company */
@endpoint({
  method: "POST",
  path: "/company/:companyId/users/:userId",
  tags: ["Company", "User"]
})
class GetUser {
  @request
  public request(
    @pathParams
    pathParams: {
      /** company identifier */
      companyId: string;
      /** user identifier */
      userId: string;
    },
    @headers
    headers: {
      /** Auth Header */
      "x-auth-token": string;
    },
    @queryParams
    queryParams: {
      /** a demo query param */
      "sample-query"?: string;
    }
  ) {}

  /** Successful creation of user */
  @response({ status: 201 })
  public successResponse(
    @headers
    headers: {
      /** Location header */
      Location: string;
    },
    /** User response body */
    @body body: UserBody
  ) {}

  /** Bad request response */
  @response({ status: 404 })
  public badRequestResponse(
    /** Error response body */
    @body body: ErrorBody
  ) {}

  @test({
    states: [{ name: "userExists", params: { id: 101 } }],
    request: {
      headers: {
        "x-auth-token": "sometoken"
      },
      pathParams: {
        companyId: "company",
        userId: "user"
      }
    },
    response: { status: 201 }
  })
  public successResponseTest() {}
}
