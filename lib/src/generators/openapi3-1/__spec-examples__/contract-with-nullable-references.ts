import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class NullableReferences {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface User {
  name: String;
}

type UserAlias = User;

type MaybeUser = User | null;

type MaybeUserAlias = MaybeUser;

interface Body {
  /** the user, if any */
  user: User | null;
  alias: UserAlias | null;
  maybeUser: MaybeUser | null;
  maybeUserAlias: MaybeUserAlias | null;
  optionalUser?: User | null;
}
