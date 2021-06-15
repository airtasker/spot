import { api, headers, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "HEAD",
  path: "/users"
})
class HeadEndpoint {
  @response({ status: 204 })
  successResponse(
    @headers
    headers: {
      Location: String;
      Link?: String;
    }
  ) {}
}
