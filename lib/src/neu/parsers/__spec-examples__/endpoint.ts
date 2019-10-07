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

@endpoint({
  method: "GET",
  path: "/path",
  tags: ["  "]
})
class EndpointWithEmptyTag {}

@endpoint({
  method: "GET",
  path: "/path",
  tags: ["tag", "tag"]
})
class EndpointWithDuplicateTag {}

@endpoint({
  method: "GET",
  path: "/path/:dynamic/path/:dynamic"
})
class EndpointWithDuplicateDynamicPathComponent {}

@endpoint({
  method: "GET",
  path: "/path/:dynamic/path/:nested"
})
class EndpointWithMissingPathParam {
  @request
  request(@pathParams
  pathParams: {
    dynamic: string;
  }) {}
}

@endpoint({
  method: "GET",
  path: "/path/:dynamic"
})
class EndpointWithExtraPathParam {
  @request
  request(@pathParams
  pathParams: {
    dynamic: string;
    nested: string;
  }) {}
}

@endpoint({
  method: "GET",
  path: "/path"
})
class EndpointWithDuplicateResponseStatus {
  @response({
    status: 200
  })
  responseOne() {}

  @response({
    status: 200
  })
  responseTwo() {}
}
