import { Integer } from "../../syntax";

type ParsedExamples = {
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
};

type MismatchedExampleAndIntegerType = {
  /**
   * @example name
   * This_is_not_an_integer
   */
  property: Integer;
}

type MismatchedExampleAndStringWithQuotesType = {
  /**
   * @example name
   * This_is_not_a_string_in_quotes
   */
  property: string;
}
