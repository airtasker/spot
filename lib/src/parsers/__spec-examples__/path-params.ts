import { pathParams } from "@airtasker/spot";

class PathParamsClass {
  pathParamsMethod(
    notPathParams: {
      property: string;
    },
    @pathParams
    pathParams: {
      property: string;
      /** property description */
      "property-with-description": string;
      arrayProperty: string[];
      /** property description
       * @example property-example */
      "property-with-example": string;
    },
    @pathParams
    paramsWithEmptyExample: {
      /**@example */
      property: string;
    },
    @pathParams
    pathParamsWithOptionalProperty: {
      property?: string;
    },
    @pathParams
    nonObjectPathParams: string,
    @pathParams
    pathParamsWithIllegalPropertyName: {
      "illegal-property-name-%$": string;
    },
    @pathParams
    pathParamsWithEmptyPropertyName: {
      "": string;
    },
    @pathParams
    pathParamsWithIllegalPropertyType: {
      property: { prop: string };
    },
    @pathParams
    pathParamsWithIllegalPropertyArrayType: {
      property: null[];
    },
    @pathParams
    optionalPathParams?: {
      property: string;
    }
  ) {}
}
