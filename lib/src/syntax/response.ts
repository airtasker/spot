/**
 * Decorator for describing a response. This should be used within an `@endpoint` decorated class.
 *
 * @example
```
@endpoint({
  // ...
})
class CreateUserEndpoint {
  // ...
  @response({ status: 201 })
  successResponse(
    // ...
  ) {}
  // ...
}
```
 */
export function response(config: ResponseConfig) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {};
}
export interface ResponseConfig {
  /** HTTP status code */
  status: number;
}
