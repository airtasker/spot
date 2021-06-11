import {
  api,
  body,
  endpoint,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "HEAD",
  path: "/users"
})
class HeadEndpoint {
  @request
  request() {}

  @response({ status: 204 })
  successResponse() {}
}
