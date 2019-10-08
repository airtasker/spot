import { endpoint, request, response } from "../../lib";

@endpoint({
  method: "POST",
  path: "/health"
})
export class HealthCheck {
  @request
  request() {}

  @response({ status: 200 })
  response() {}
}
