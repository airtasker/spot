import { api, body, endpoint, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class GetEndpoint {
  @response({ status: 200 })
  successResponse(@body body: Users) {}
}

type Users = User[];

interface User {
  id: String;
  name: String;
}
