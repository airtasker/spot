/**
 * Decorator for describing a test. This should be used within an `@endpoint` decorated class.
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

  @test({
    states: [{ name: "a user exists", params: { id: 101 } }],
    request: {
      pathParams: { id: 101 }
    },
    response: {
      status: 200
    }
  })
  getUserSuccessTest() {}
  //...
}
//...
```
 */
export function test(
  config: TestConfig,
  options?: { allowInvalidRequest: boolean }
) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {};
}
interface TestConfig {
  states?: { name: string; params?: { [key: string]: any } }[];
  request?: {
    headers?: { [key: string]: any };
    pathParams?: { [key: string]: any };
    queryParams?: { [key: string]: any };
    body?: object;
  };
  response: {
    status: number;
    headers?: { [key: string]: any };
    body?: object;
  };
}
