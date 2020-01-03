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
  method: "PATCH",
  path: "/users"
})
class PatchEndpoint {
  @request
  request() {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
