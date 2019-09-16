import { headers, Int64 } from "@airtasker/spot";

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
      optionalProperty?: Int64;
    },
    @headers
    nonObjectHeaders: string,
    @headers
    headersWithIllegalPropertyName: {
      "illegal-field-name-header%$": string;
    },
    @headers
    headersWithEmptyPropertyName: {
      "": string;
    },
    @headers
    headersWithIllegalType: {
      property: boolean;
    },
    @headers
    optionalHeaders?: {
      property: string;
    }
  ) {}
}
