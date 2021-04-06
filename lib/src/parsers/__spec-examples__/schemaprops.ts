import { Integer } from "../../syntax";

type SchemaPropTests = {
  /** property-schemaprop description
   * @schemaprop pattern
   * "property-schemaprop-value"
   *  */
  "property-with-schemaprop": string;
  /** property-two-schemaprops description
   * @schemaprop minimum
   * 123
   * @schemaprop default
   * 456
   * */
  "property-with-schemaprops": Integer;
  /** property-schemaprop description
   * @schemaprop example
   * false
   *  */
  "property-with-boolean": boolean;
  /**
   * @schemaprop example
   * This_is_not_an_integer
   */
  "property-with-mistyped-schemaprop": Integer;
  /**
   * @schemaprop example
   * This_is_not_a_string_in_quotes
   */
  "property-with-no-string-in-quotes": string;
};
