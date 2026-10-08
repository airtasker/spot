import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class NullType {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

type Nothing = null;

interface Body {
  name: String;
  nothing: null;
  aliasedNothing: Nothing;
}
