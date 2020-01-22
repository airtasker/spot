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
  union: ReferenceA | ReferenceB;
}

interface ReferenceA {
  name: String;
}

interface ReferenceB {
  title: String;
}
