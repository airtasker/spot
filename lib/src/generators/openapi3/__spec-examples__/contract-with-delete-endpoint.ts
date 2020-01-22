import {
  api,
  endpoint,
  pathParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "DELETE",
  path: "/users/:id"
})
class DeleteEndpoint {
  @request
  request(
    @pathParams
    pathParams: {
      id: String;
    }
  ) {}

  @response({ status: 204 })
  successResponse() {}
}
