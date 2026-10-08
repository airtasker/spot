import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class NullableIntersections {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Named {
  name: String;
}

interface Aged {
  age: String;
}

type NamedAndAged = Named & Aged;

interface Body {
  // The parser does not accept a parenthesised type, which prettier would
  // otherwise add here; `&` binds tighter than `|` either way.
  // prettier-ignore
  inline: Named & Aged | null;
  reference: NamedAndAged | null;
  required: Named & Aged;
}
