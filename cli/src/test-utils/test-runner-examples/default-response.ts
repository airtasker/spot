import {
  api,
  body,
  defaultResponse,
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

  @defaultResponse
  defaultResponse(@body body: DefaultErrorBody) {}

  @test(
    {
      request: {
        body: {
          private: true
        }
      },
      response: {
        status: 400
      }
    },
    { allowInvalidRequest: true }
  )
  defaultResponseTest() {}
}

interface CreateCompanyRequestBody {
  name: String;
  private: boolean;
}

interface CompanyBody {
  name: String;
}

interface DefaultErrorBody {
  error: String;
}
