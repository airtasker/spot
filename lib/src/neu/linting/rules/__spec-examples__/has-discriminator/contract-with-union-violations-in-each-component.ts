import {
  api,
  body,
  defaultResponse,
  endpoint,
  Float,
  headers,
  pathParams,
  queryParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "POST",
  path: "/companies/:companyId/users"
})
class Endpoint {
  @request
  request(
    @headers
    headers: {
      header: String | Float;
    },
    @pathParams
    pathParams: {
      companyId: String | Float;
    },
    @queryParams
    queryParams: {
      query: String | Float;
    },
    @body
    body: RequestBody
  ) {}

  @response({ status: 200 })
  successResponse(
    @headers
    headers: {
      header: String | Float;
    },
    @body body: SuccessBody
  ) {}

  @defaultResponse
  defaultResponse(
    @headers
    headers: {
      header: String | Float;
    },
    @body body: ErrorBody
  ) {}
}

interface RequestBody {
  requestUnion: RequestA | RequestB;
}

interface RequestA {
  type: "a";
  requestA: String;
}

interface RequestB {
  requestB: String;
}

interface SuccessBody {
  successUnion: SuccessA | SuccessB;
}

interface SuccessA {
  type: "a";
  successA: String;
}

interface SuccessB {
  successB: String;
}

interface ErrorBody {
  errorUnion: ErrorA | ErrorB;
}

interface ErrorA {
  type: "a";
  errorA: String;
}

interface ErrorB {
  errorB: String;
}
