import {
  api,
  body,
  endpoint,
  Float,
  queryParams,
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
  request(
    @queryParams
    queryParams: {
      query: String | Float;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Body {
  body: String;
}
