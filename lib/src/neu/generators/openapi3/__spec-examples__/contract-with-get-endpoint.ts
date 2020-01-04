import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class GetEndpoint {
  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }[]) {}
}
