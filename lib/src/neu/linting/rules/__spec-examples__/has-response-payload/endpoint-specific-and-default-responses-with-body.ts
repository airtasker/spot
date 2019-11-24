import {
  api,
  body,
  defaultResponse,
  endpoint,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Endpoint {
  @response({ status: 200 })
  successResponse(@body body: Body) {}

  @defaultResponse
  defaultResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
