import {
  api,
  body,
  endpoint,
  headers,
  request,
  response,
  String,
  Integer
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
      /** property-schemaprop description for string
       * @schemaprop minLength
       * 12
       * @schemaprop maxLength
       * 20
       * @schemaprop pattern
       * "^[0-9a-z_]+$"
       *  */
      status: String;
      /** property-schemaprop description for integer
       * @schemaprop minimum
       * 1
       * @schemaprop maximum
       * 100
       * @schemaprop default
       * 42
       *  */
      size: Integer;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }[]) {}
}
