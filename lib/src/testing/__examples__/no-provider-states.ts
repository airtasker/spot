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
}

interface CreateCompanyRequestBody {
  name: String;
  private: boolean;
}

interface CompanyBody {
  name: String;
}
