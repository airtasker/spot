import {
  api,
  body,
  endpoint,
  headers,
  request,
  response,
  String,
  test
} from "@airtasker/spot";

@api({ name: "company-api" })
class CompanyApi {}

@endpoint({
  method: "POST",
  path: "/companies"
})
class CreateCompany {
  @request
  request(@body body: CreateCompanyRequestBody) {}

  @response({ status: 201 })
  successResponse(
    @headers
    headers: {
      Location: String;
    },
    @body body: CompanyBody
  ) {}

  @response({ status: 400 })
  badRequestResponse(@body body: ErrorBody) {}

  @test({
    request: {
      body: {
        name: "My Company",
        private: true
      }
    },
    response: {
      status: 201
    }
  })
  successResponseTest() {}

  @test(
    {
      request: {
        body: {
          name: 5
        }
      },
      response: {
        status: 400
      }
    },
    { allowInvalidRequest: true }
  )
  badRequestTest() {}
}

interface CreateCompanyRequestBody {
  name: String;
  private: boolean;
}

interface CompanyBody {
  name: String;
}

interface ErrorBody {
  message: String;
}
