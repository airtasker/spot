import { Integer } from "../../syntax";

type SchemaPropTests = {
  /** property-schemaprop description
   * @oaSchemaProp pattern
   * "property-schemaprop-value"
   *  */
  "property-with-schemaprop": string;
  /** property-two-schemaprops description
   * @oaSchemaProp minimum
   * 123
   * @default 456
   * */
  "property-with-schemaprops": Integer;
  /** property-schemaprop description
   * @oaSchemaProp example
   * false
   *  */
  "property-with-boolean": boolean;
  /**
   * @oaSchemaProp example
   * This_is_not_an_integer
   */
  "property-with-mistyped-schemaprop": Integer;
  /**
   * @oaSchemaProp example
   * This_is_not_a_string_in_quotes
   */
  "property-with-no-string-in-quotes": string;
};
