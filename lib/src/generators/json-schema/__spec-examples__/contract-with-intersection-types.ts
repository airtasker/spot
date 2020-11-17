import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class IntersectionType {
  @response({ status: 200 })
  successResponse(@body body: IntersectionResponse) {}
}

type IntersectionResponse = { id: String } & { name: String };
