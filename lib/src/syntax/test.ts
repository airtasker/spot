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
export function test<RequestBody = object | undefined, ResponseBody = object>(
  config: TestConfig<RequestBody, ResponseBody>,
  options?: { allowInvalidRequest: boolean }
) {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {};
}
interface TestConfig<RequestBody, ResponseBody> {
  states?: Array<{ name: string; params?: { [key: string]: any } }>;
  request?: {
    headers?: { [key: string]: any };
    pathParams?: { [key: string]: any };
    queryParams?: { [key: string]: any };
    body: RequestBody;
  };
  response: {
    status: number;
    headers?: { [key: string]: any };
    body?: RecursivePartial<ResponseBody>;
  };
}

// See https://stackoverflow.com/a/51365037.
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<RecursivePartial<U>>
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
};
