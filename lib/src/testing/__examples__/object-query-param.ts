import {
  api,
  body,
  endpoint,
  Integer,
  queryParams,
  request,
  response,
  String,
  test
} from "@airtasker/spot";

@api({ name: "company-api" })
class CompanyApi {}

@endpoint({
  method: "GET",
  path: "/companies"
})
class GetCompanies {
  @request
  request(
    @queryParams
    queryParam: {
      profile?: { name: String };
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: CompanyBody[]) {}

  @test({
    request: {
      queryParams: {
        profile: {
          name: "testname"
        }
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
