import { Date, Integer, String } from "../../syntax";

type SchemaPropTests = {
  /** property-schemaprop description
   * @oaSchemaProp pattern
   * "property-schemaprop-value"
   *  */
  "property-with-schemaprop": string;
   /**
   * @oaSchemaProp example
   * "123.3"
   */
  "property-with-string": String;
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
  /** property-schemaprop date
   * @oaSchemaProp example
   * "1990-12-31"
   *  */
  "property-with-date": Date;
  /** property-schemaprop array of integer
   * @oaSchemaProp example
   * [1990,12,31]
   *  */
  "property-with-array": Integer[];
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
