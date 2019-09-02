import { body, defaultResponse, headers } from "@airtasker/spot";

class DefaultResponseClass {
  notDefaultResponse() {}

  @defaultResponse
  parameterlessDefaultResponse() {}

  /** default response description */
  @defaultResponse
  defaultResponse(
    @headers
    headers: {
      property: string;
    },
    @body body: string
  ) {}
}
