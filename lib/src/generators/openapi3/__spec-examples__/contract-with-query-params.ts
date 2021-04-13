import {
  api,
  body,
  endpoint,
  queryParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/companies"
})
class EndpointWithQueryParams {
  @request
  request(
    @queryParams
    queryParams: {
      country: String;
      "post.code"?: String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }[]) {}
}
