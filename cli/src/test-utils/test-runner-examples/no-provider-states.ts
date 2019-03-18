import {
  api,
  body,
  endpoint,
  headers,
  Integer,
  pathParams,
  request,
  response,
  String,
  test
} from "@airtasker/spot";

@api({ name: "company-api" })
class CompanyApi {}

@endpoint({
  method: "POST",
  path: "/companies/:companyId/users"
})
class CreateUser {
  @request
  request(
    @pathParams
    pathParams: {
      companyId: String;
    },
    @body body: CreateUserRequestBody
  ) {}

  @response({ status: 201 })
  successResponse(
    @headers
    headers: {
      Location: String;
    },
    @body body: UserBody
  ) {}

  @test({
    request: {
      pathParams: {
        companyId: "abc"
      },
      body: {
        firstName: "John",
        lastName: "Snow",
        age: 15,
        email: "johnsnow@spot.com"
      }
    },
    response: {
      status: 201
    }
  })
  successResponseTest() {}
}

interface CreateUserRequestBody {
  firstName: String;
  lastName: String;
  age: Integer;
  email: String;
}

interface UserBody {
  firstName: string;
  lastName: string;
  email: String;
}
