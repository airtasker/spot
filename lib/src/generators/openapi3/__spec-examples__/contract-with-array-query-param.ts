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
class EndpointWithArrayQueryParam {
  @request
  request(
    @queryParams
    queryParams: {
      countries: String[];
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Array<{ id: String; name: String }>) {}
}
