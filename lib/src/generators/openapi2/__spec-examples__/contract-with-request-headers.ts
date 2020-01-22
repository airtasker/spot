import {
  api,
  body,
  endpoint,
  headers,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class EndpointWithRequestHeaders {
  @request
  request(
    @headers
    headers: {
      "Accept-Encoding"?: String;
      "Accept-Language": String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Array<{ id: String; name: String }>) {}
}
