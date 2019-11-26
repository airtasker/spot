import {
  api,
  body,
  endpoint,
  pathParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "PATCH",
  path: "/users/:id"
})
class PatchEndpoint {
  @request
  request(
    @pathParams
    pathParams: {
      id: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
