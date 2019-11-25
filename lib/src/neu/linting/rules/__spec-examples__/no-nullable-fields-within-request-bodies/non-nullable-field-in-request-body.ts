import {
  api,
  body,
  defaultResponse,
  endpoint,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "POST",
  path: "/users"
})
class Endpoint {
  @request
  request(
    @body
    body: Body
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}

  @defaultResponse
  defaultResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
