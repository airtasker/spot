import { QueryParamArrayStrategy } from "../neu/definitions";

/**
 * Class decorator factory for describing a configuration.
 * Should be used in conjunction with @api.
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
export interface ConfigConfig {
  /** The global configuration for parameter serialization strategy */
  paramSerializationStrategy: ParamSerializationStrategy;
}

interface ParamSerializationStrategy {
  query?: QueryParamSerializationStrategy;
}

interface QueryParamSerializationStrategy {
  array?: QueryParamArrayStrategy;
}
