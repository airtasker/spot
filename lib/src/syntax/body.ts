/**
 * Decorator for describing the body of requests and responses. This is used to decorate a parameter object in `@request` and `@response` decorated methods.
 *
 * @example
```
@endpoint({
  // ...
})
class CreateUserEndpoint {
  @request
  request(
    @body body: CreateUserBody
    // ...
  ) {}
  // ...

  @response(
    // ...
  )
  successResponse(
    @body body: UserBody
    // ...
  ) {}
  // ...
}

interface CreateUserBody {
  firstName: string;
  lastName: string;
}

interface UserBody {
  firstName: string;
  lastName: string;
}
```
 */
export declare function body(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
