import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/pets"
})
class OverlappingNullableMembers {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Cat {
  meows: String;
}

interface Dog {
  barks: String;
}

type MaybeCat = Cat | null;

type MaybeDog = Dog | null;

interface Body {
  pet: MaybeCat | MaybeDog;
}
