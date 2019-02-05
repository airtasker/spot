/**
 * Decorator for describing an interaction. This should be used within an `@endpoint` decorated class.
 * 
 * @example
```
@endpoint({
  method: "GET",
  path: "/users/:id"
})
class GetUser {
  @request
  request(@pathParams pathParams: { id: number }) {}

  @response({ status: 200 })
  successfulResponse(//...) {}

  @interaction({
    states: [{ name: "a user exists", params: { id: 101 } }],
    request: {
      pathParams: { id: 101 }
    },
    response: {
      status: 200
    }
  })
  getUserSuccessInteraction() {}
  //...
}
//...
```
 */
export function interaction(config: InteractionConfig) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {};
}
interface InteractionConfig {
  states?: { name: string; params?: object }[];
  request?: {
    headers?: object;
    pathParams?: object;
    queryParams?: object;
  };
  response: {
    status: number;
  };
}
