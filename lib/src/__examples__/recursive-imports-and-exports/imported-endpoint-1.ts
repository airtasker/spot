import { endpoint, request, response } from "@airtasker/spot";
import "./imported-endpoint-2";

@endpoint({
  method: "GET",
  path: "/imported-endpoint-1"
})
class ImportedEndpoint1 {
  @request
  request() {}

  @response({ status: 200 })
  successResponse() {}
}
