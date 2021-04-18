import { api, endpoint, response, String, body } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

/**
 * My description
 *
 * @summary
 * My summary
 */
@endpoint({
  method: "GET",
  path: "/users"
})
class GetEndpoint {
  @response({ status: 200 })
  successResponse(@body body: { id: String; name: String }) {}
}
