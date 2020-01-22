import {
  api,
  body,
  defaultResponse,
  endpoint,
  queryParams,
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
    @queryParams
    queryParams: {
      query: InlineObjectUnion;
    },
    @body
    body: Body
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}

  @defaultResponse
  defaultResponse(@body body: Body) {}
}

interface Body {
  field: InlineObjectUnion;
}

type InlineObjectUnion = /* prettier-ignore */ { name: String } | { title: String };
