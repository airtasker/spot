import {
  body,
  defaultResponse,
  endpoint,
  request,
  response
} from "@airtasker/spot";
import { DefaultBody, SuccessBody } from "./contract";

@endpoint({ method: "POST", path: "/path" })
class PostEndpoint {
  @request
  request(@body body: RequestBody) {}

  @defaultResponse
  defaultResponse(@body body: DefaultBody) {}

  @response({ status: 200 })
  successResponse(@body body: SuccessBody) {}
}

interface RequestBody {
  message: string;
}
