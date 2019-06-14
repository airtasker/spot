import { endpoint, request, response } from "@airtasker/spot";

export * from "./exported-endpoint-2";

@endpoint({
  method: "GET",
  path: "/exported-endpoint-1"
})
class ExportedEndpoint1 {
  @request
  request() {}

  @response({ status: 200 })
  successResponse() {}
}
