import {
  api,
  body,
  endpoint,
  pathParams,
  request,
  response,
  String,
  test
} from "@airtasker/spot";

@api({ name: "company-api" })
class CompanyApi {}

@endpoint({
  method: "GET",
  path: "/companies/:companyId/users/:userId"
})
class GetUser {
  @request
  request(
    @pathParams
    pathParams: {
      companyId: String;
      userId: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: UserBody) {}

  @test({
    states: [
      { name: "a company exists", params: { id: "abc" } },
      { name: "a user exists", params: { id: "def", companyId: "abc" } }
    ],
    request: {
      pathParams: {
        companyId: "abc",
        userId: "def"
      }
    },
    response: {
      status: 200
    }
  })
  successResponseTest() {}
}

interface UserBody {
  firstName: string;
  lastName: string;
  email: String;
}
