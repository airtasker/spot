/**
 * Decorator for describing path params in requests. This is used to decorate a parameter object in `@request` decorated methods.
 * 
 * @example
```
@endpoint({
  path: "/users/:id",
  // ...
})
class GetUserEndpoint {
  @request
  request(
    @pathParams
    pathParams: {
      id: string;
      // ...
    }
    // ...
  ) {}
  // ...
}
```
 */
declare function pathParams(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
