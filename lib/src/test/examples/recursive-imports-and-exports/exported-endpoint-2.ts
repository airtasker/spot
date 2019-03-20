import { endpoint, request, response } from "@airtasker/spot";

@endpoint({
  method: "GET",
  path: "/exported-endpoint-2"
})
class ExportedEndpoint2 {
  @request
  request() {}

  @response({ status: 200 })
  successResponse() {}
}
