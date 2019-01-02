/**
 * Decorator for describing a request. This should be used only once within an `@endpoint` decorated class.
 * 
 * @example
```
@endpoint({
  // ...
})
class CreateUserEndpoint {
  @request
  request(
    // ...
  ) {}
  // ...
}
```
 */
declare function request(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void;
