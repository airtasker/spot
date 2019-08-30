import { ParamSerializationStrategy } from "../models/types";
/**
 * Class decorator factory for describing an API configuration.
 *
 * @param config configuration
 * @example
```
@api({ name: "Company API" })
@config({
  paramSerializationStrategy: {
    query: {
      array: "comma"
    }
  }
})
class CompanyApi {}
```
 */
export function config(config: ConfigConfig) {
  return (target: any) => {};
}
interface ConfigConfig {
  /** The global configuration for parameter serialization strategy */
  paramSerializationStrategy: ParamSerializationStrategy;
}
