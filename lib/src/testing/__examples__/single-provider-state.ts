import {
  api,
  body,
  endpoint,
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
  method: "GET",
  path: "/companies/:companyId"
})
class GetCompany {
  @request
  request(
    @pathParams
    pathParams: {
      companyId: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: CompanyBody) {}

  @test({
    states: [{ name: "a company exists", params: { id: "abc" } }],
    request: {
      pathParams: {
        companyId: "abc"
      }
    },
    response: {
      status: 200
    }
  })
  successResponseTest() {}
}

interface CompanyBody {
  name: String;
  employeeCount: Integer;
}
