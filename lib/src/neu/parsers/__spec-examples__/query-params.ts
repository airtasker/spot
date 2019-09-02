import { queryParams } from "@airtasker/spot";

class QueryParamsClass {
  queryParamsMethod(
    notQueryParams: {
      property: string;
    },
    @queryParams
    queryParams: {
      property: string;
      /** property description */
      "property-with-description": string;
      optionalProperty?: string;
    },
    @queryParams
    nonObjectQueryParams: string,
    @queryParams
    optionalQueryParams?: {
      property: string;
    }
  ) {}
}
