import {
  api,
  body,
  defaultResponse,
  endpoint,
  pathParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users/:id"
})
class EndpointWithResponses {
  @request
  request(
    @pathParams
    pathParams: {
      id: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }) {}

  @response({ status: 404 })
  notFoundResponse(@body body: { message: String; status: String }) {}

  @defaultResponse
  defaultResponse(@body body: { message: String }) {}
}
