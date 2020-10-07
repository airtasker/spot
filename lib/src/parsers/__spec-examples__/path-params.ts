import { pathParams, Integer } from "@airtasker/spot";

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
      /** property-example description
       * @example property-example
       * property-example-value
       *  */
      "property-with-example": string;
      /** property-two-examples description
       * @example property-example-one
       * 123
       * @example property-example-two
       * 456
       * */
      "property-with-examples": Integer;
    },
    @pathParams
    paramsWithEmptyExample: {
      /**@example */
      property: string;
    },
    @pathParams
    paramsWithDuplicateExampleName: {
      /**@example name
       * "123"
       * @example name
       * "456"
       */
      property: string;
    },
    @pathParams
    paramsWithExampleWithoutValue: {
      /**@example name*/
      property: string;
    },
    @pathParams
    paramsWithNonMatchingExampleType: {
      /**@example name
       * This_is_not_an_integer
       */
      property: Integer;
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
