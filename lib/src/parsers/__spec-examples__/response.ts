import { body, headers, response } from "@airtasker/spot";

class ResponseClass {
  notResponse() {}

  @response({ status: 200 })
  parameterlessResponse() {}

  /** response description */
  @response({ status: 200 })
  response(
    @headers
    headers: {
      property: string;
    },
    @body body: string
  ) {}
}
