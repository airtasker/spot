import { headers } from "@airtasker/spot";

class HeadersClass {
  headersMethod(
    notHeaders: {
      property: string;
    },
    @headers
    headers: {
      property: string;
      /** property description */
      "property-with-description": string;
      optionalProperty?: string;
    },
    @headers
    nonObjectHeaders: string,
    @headers
    optionalHeaders?: {
      property: string;
    }
  ) {}
}
