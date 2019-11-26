import { api, defaultResponse, endpoint } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Endpoint {
  @defaultResponse
  defaultResponse() {}
}
