import {
  api,
  body,
  endpoint,
  headers,
  request,
  response,
  String,
  Integer,
  Float
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class EndpointWithSchemaPropsOnHeaders {
  @request
  request(
    @headers
    headers: {
      /** property-schemaprop description for string
       * @oaSchemaProp title
       * "status-title"
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
       * @oaSchemaProp exclusiveMaximum
       * true
       * @oaSchemaProp deprecated
       * true
       * @default 42
       *  */
      size: Integer;
    }
  ) {}

  @response({ status: 200 })
  successResponse(
    @body
    body: {
      id: String;
      name: String;
      /** property-schemaprop description for object
       * @oaSchemaProp minProperties
       * 1
       * @oaSchemaProp maxProperties
       * 100
       * @oaSchemaProp additionalProperties
       * true
       *  */
      element: {
        /** property-schemaprop description for float inner object
         * @oaSchemaProp example
         * 12.0
         * @oaSchemaProp maximum
         * 99.95
         * @oaSchemaProp exclusiveMinimum
         * false
         * @oaSchemaProp multipleOf
         * 4
         *  */
        price: Float;
      };
      /** property-schemaprop description for array
       * @oaSchemaProp minItems
       * 1
       * @oaSchemaProp maxItems
       * 5
       * @oaSchemaProp uniqueItems
       * true
       *  */
      currencies?: String[];
    }[]
  ) {}
}
