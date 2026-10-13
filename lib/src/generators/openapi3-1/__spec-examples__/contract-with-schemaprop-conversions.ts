import {
  api,
  body,
  Double,
  endpoint,
  Float,
  headers,
  Int64,
  Integer,
  queryParams,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/prices"
})
class SchemaPropConversions {
  @request
  request(
    @headers
    headers: {
      /** A lower bound made exclusive
       * @oaSchemaProp minimum
       * 1
       * @oaSchemaProp exclusiveMinimum
       * true
       * @default 42
       *  */
      size: Integer;
    },
    @queryParams
    queryParams: {
      /** An upper bound made exclusive, with the flag written first
       * @oaSchemaProp exclusiveMaximum
       * true
       * @oaSchemaProp maximum
       * 100
       * @oaSchemaProp example
       * 10
       *  */
      limit?: Integer;
    }
  ) {}

  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

/** A component with an example
 * @oaSchemaProp example
 * {"amount":3.5}
 * @oaSchemaProp minProperties
 * 1
 *  */
interface Price {
  amount: Double;
}

interface Body {
  /** Both bounds made exclusive
   * @oaSchemaProp minimum
   * 0
   * @oaSchemaProp exclusiveMinimum
   * true
   * @oaSchemaProp maximum
   * 1
   * @oaSchemaProp exclusiveMaximum
   * true
   *  */
  ratio: Float;
  /** False flags are dropped, with or without a bound
   * @oaSchemaProp minimum
   * 1
   * @oaSchemaProp exclusiveMinimum
   * false
   * @oaSchemaProp exclusiveMaximum
   * false
   * @oaSchemaProp multipleOf
   * 2
   *  */
  even: Int64;
  /** A string with an example
   * @oaSchemaProp title
   * "code-title"
   * @oaSchemaProp minLength
   * 2
   * @oaSchemaProp maxLength
   * 8
   * @oaSchemaProp pattern
   * "^[A-Z]+$"
   * @oaSchemaProp example
   * "ABC"
   * @oaSchemaProp deprecated
   * true
   *  */
  code: String;
  /** An object with an example
   * @oaSchemaProp example
   * {"name":"tag"}
   * @oaSchemaProp minProperties
   * 1
   * @oaSchemaProp maxProperties
   * 3
   * @oaSchemaProp additionalProperties
   * false
   *  */
  tag: {
    name: String;
  };
  /** An array with an example
   * @oaSchemaProp example
   * ["AUD","USD"]
   * @oaSchemaProp minItems
   * 1
   * @oaSchemaProp maxItems
   * 5
   * @oaSchemaProp uniqueItems
   * true
   *  */
  currencies: String[];
  /** A literal union with an example
   * @oaSchemaProp title
   * "status-title"
   * @oaSchemaProp example
   * "OPEN"
   * @oaSchemaProp deprecated
   * false
   *  */
  status: "OPEN" | "CLOSED";
  /** A nullable union with schemaprops
   * @oaSchemaProp title
   * "note-title"
   * @oaSchemaProp deprecated
   * true
   *  */
  note: String | null;
  /** An intersection with an example
   * @oaSchemaProp title
   * "named-price"
   * @oaSchemaProp example
   * {"amount":3.5,"name":"tag"}
   *  */
  namedPrice: { amount: Double } & { name: String };
  /** A nullable reference to a component with an example */
  previous: Price | null;
}
