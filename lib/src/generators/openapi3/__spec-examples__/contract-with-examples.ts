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
class EndpointWithExampleOnHeaders {
  @request
  request(
    @headers
    headers: {
      /** property-example description
       * @example property-example
       * "property-example-value"
       *  */
      "Accept-Language": String;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }[]) {}
}
