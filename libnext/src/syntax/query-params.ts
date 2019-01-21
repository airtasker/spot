/**
 * Decorator for describing query params in requests. This is used to decorate a parameter object in `@request` decorated methods.
 * 
 * @example
```
@endpoint({
  // ...
})
class GetUsersEndpoint {
  @request
  request(
    @queryParams
    queryParams: {
      search?: string;
      // ...
    }
    // ...
  ) {}
  // ...
}
```
 */
export declare function queryParams(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
