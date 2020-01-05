import {
  api,
  body,
  endpoint,
  Int32,
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
      pagination: {
        page: Int32;
        order: "desc" | "asc";
      };
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Array<{ id: String; name: String }>) {}
}
