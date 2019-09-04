import {
  body,
  defaultResponse,
  endpoint,
  headers,
  pathParams,
  queryParams,
  request,
  response
} from "@airtasker/spot";

class NotEndpointClass {}

/** endpoint description */
@endpoint({
  method: "POST",
  path: "/path/:pathParam/nest",
  tags: ["tag1", "tag2"]
})
class EndpointClass {
  @request
  request(
    @headers
    headers: {
      property: string;
    },
    @pathParams
    pathParams: {
      pathParam: string;
    },
    @queryParams
    queryParams: {
      property: string;
    },
    @body
    body: string
  ) {}

  @defaultResponse
  defaultResponse(
    @headers
    headers: {
      property: string;
    },
    @body body: string
  ) {}

  @response({ status: 200 })
  response(
    @headers
    headers: {
      property: string;
    },
    @body body: string
  ) {}
}

@endpoint({
  method: "GET",
  path: "/path"
})
class MinimalEndpointClass {}
