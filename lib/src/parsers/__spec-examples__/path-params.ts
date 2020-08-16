import { pathParams } from "@airtasker/spot";
import { TypeKind, FloatType } from "../../types";

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
       * property-example-one-value
       * @example property-example-two 
       * property-example-two-value
       * */
      "property-with-examples": string[];
    },
    @pathParams
    paramsWithEmptyExample: {
      /**@example */
      property: string;
    },
    @pathParams
    paramsWithDuplicateExampleName: {
      /**@example name
       * 123
       * @example name
       * 456
      */
      property: string;
    },
    @pathParams
    paramsWithExampleWithoutValue: {
      /**@example name*/
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
