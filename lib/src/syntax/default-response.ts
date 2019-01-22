/**
 * Decorator for describing a default response. This should be used only once within an `@endpoint` decorated class.
 * 
 * @example
```
@endpoint({
  // ...
})
class CreateUserEndpoint {
  // ...
  @defaultResponse
  successResponse(
    // ...
  ) {}
  // ...
}
```
 */
export declare function defaultResponse(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void;
