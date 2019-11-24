import {
  api,
  body,
  defaultResponse,
  endpoint,
  request,
  response,
  String
} from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "POST",
  path: "/companies"
})
class Endpoint {
  @request
  request(
    @body
    body: RequestBody
  ) {}

  @response({ status: 200 })
  successResponse(@body body: SuccessBody) {}

  @defaultResponse
  defaultResponse(@body body: ErrorBody) {}
}

interface RequestBody {
  array: String[] | null;
}

interface SuccessBody {
  array: String[] | null;
}

interface ErrorBody {
  array: String[] | null;
}
