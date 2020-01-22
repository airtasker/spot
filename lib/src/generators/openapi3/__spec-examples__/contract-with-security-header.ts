import {
  api,
  body,
  endpoint,
  response,
  securityHeader,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {
  @securityHeader
  "security-header": String;
}

@endpoint({
  method: "GET",
  path: "/users"
})
class GetEndpoint {
  @response({ status: 200 })
  successResponse(@body body: Array<{ id: String; name: String }>) {}
}
