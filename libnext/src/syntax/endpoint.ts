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
function endpoint(config: EndpointConfig) {
  return (target: any) => {};
}
interface EndpointConfig {
  /** HTTP method */
  method: string;
  /** URL path */
  path: string;
  /** Endpoint grouping tags */
  tags?: string[];
}
