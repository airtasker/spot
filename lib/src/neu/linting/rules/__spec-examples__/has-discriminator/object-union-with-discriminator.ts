import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Endpoint {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Body {
  union: TypeA | TypeB;
}

interface TypeA {
  type: "a";
  a: String;
}

interface TypeB {
  type: "b";
  b: String;
}
