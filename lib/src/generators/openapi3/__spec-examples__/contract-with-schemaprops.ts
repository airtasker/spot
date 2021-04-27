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
       * @oaSchemaProp minLength
       * 12
       * @oaSchemaProp maxLength
       * 20
       * @oaSchemaProp pattern
       * "^[0-9a-z_]+$"
       *  */
      status: String;
      /** property-schemaprop description for integer
       * @oaSchemaProp minimum
       * 1
       * @oaSchemaProp maximum
       * 100
       * @oaSchemaProp default
       * 42
       *  */
      size: Integer;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }[]) {}
}
