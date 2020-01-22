import {
  api,
  body,
  config,
  defaultResponse,
  endpoint,
  headers,
  pathParams,
  queryParams,
  request,
  response,
  securityHeader,
  String
} from "@airtasker/spot";
import "./contract-dependency";

/** contract description */
@api({ name: "contract" })
@config({
  paramSerializationStrategy: {
    query: {
      array: "comma"
    }
  }
})
class Contract {
  @securityHeader
  "security-header": String;
}

@endpoint({ method: "GET", path: "/path/:param/nest" })
class GetEndpoint {
  @request
  request(
    @pathParams
    pathParams: {
      param: String;
    },
    @headers
    headers: {
      header: String;
    },
    @queryParams
    queryParams: {
      param: String;
    }
  ) {}

  @defaultResponse
  defaultResponse(@body body: DefaultBody) {}

  @response({ status: 200 })
  successResponse(
    @headers headers: { responseHeader: String },
    @body body: SuccessBody
  ) {}
}

export interface DefaultBody {
  message: String;
}

export interface SuccessBody {
  message: String;
}
