import { endpoint, request, response } from "@airtasker/spot";

@endpoint({
  method: "GET",
  path: "/imported-endpoint-2"
})
class ImportedEndpoint2 {
  @request
  request() {}

  @response({ status: 200 })
  successResponse() {}
}
