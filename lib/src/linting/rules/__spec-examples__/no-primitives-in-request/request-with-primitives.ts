import { api, body, request, endpoint } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/users"
})
class Endpoint {
  @request
  request(@body body: UserName) {}
}

type UserName = string;
