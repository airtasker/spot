import {
  api,
  body,
  endpoint,
  response,
  String,
  request,
  pathParams
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/companies/:companyId/users/:userId"
})
class EndpointWithPathParams {
  @request
  request(
    @pathParams
    pathParams: {
      companyId: String;
      userId: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }) {}
}
