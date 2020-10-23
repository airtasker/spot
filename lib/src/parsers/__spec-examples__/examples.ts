import { Integer } from "../../syntax";

type ExampleTests = {
  /** property-example description
   * @example property-example
   * "property-example-value"
   *  */
  "property-with-example": string;
  /** property-two-examples description
   * @example property-example-one
   * 123
   * @example property-example-two
   * 456
   * */
  "property-with-examples": Integer;
  /** property-example description
   * @example property-example
   * false
   *  */
  "property-with-boolean": boolean;
  /**
   * @example name
   * This_is_not_an_integer
   */
  "property-with-mistyped-example": Integer;
  /**
   * @example name
   * This_is_not_a_string_in_quotes
   */
  "property-with-no-string-in-quotes": string;
};
