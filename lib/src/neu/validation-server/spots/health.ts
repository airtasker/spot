import { endpoint, request, response } from "../../../lib";

@endpoint({
  method: "GET",
  path: "/health"
})
export class HealthCheck {
  @request
  request() {}

  @response({ status: 200 })
  response() {}
}
