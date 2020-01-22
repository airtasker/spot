import { HttpMethod } from "../neu/definitions";

/**
 * Endpoint decorator factory for describing an API.
 *
 * @param config configuration
 * @example
```
@endpoint({
  method: "POST",
  path: "/users",
  tags: ["User"]
})
class CreateUserEndpoint {
  // ...
}
```
 */
export function endpoint(config: EndpointConfig) {
  return (target: any) => {};
}

export interface EndpointConfig {
  /** HTTP method */
  method: HttpMethod;
  /** URL path */
  path: string;
  /** Endpoint grouping tags */
  tags?: string[];
}
