/**
 * Decorator for describing headers in requests and responses. This is used to decorate a parameter object in `@request` and `@response` decorated methods.
 * 
 * @example
```
@endpoint({
  // ...
})
class CreateUserEndpoint {
  @request
  request(
    @headers
    headers: {
      "x-auth-token": string;
      "Content-Type": string;
      // ...
    }
    // ...
  ) {}
  // ...

  @response(
    // ...
  )
  successResponse(
    @headers
    headers: {
      Location: string;
      // ...
    },
    // ..
  ) {}
}
```
 */
export declare function headers(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
