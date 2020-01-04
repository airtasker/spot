import {
  api,
  body,
  config,
  endpoint,
  queryParams,
  request,
  response,
  String
} from "@airtasker/spot";

@config({
  paramSerializationStrategy: {
    query: {
      array: "comma"
    }
  }
})
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
  successResponse(@body body: { id: String; name: String }[]) {}
}
