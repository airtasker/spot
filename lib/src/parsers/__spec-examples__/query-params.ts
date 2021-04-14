import { Integer, queryParams } from "@airtasker/spot";

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
      /** property-example description
       * @example property-example
       * "property-example-value"
       *  */
      "property-with-example": string;
      /** property-two-examples description
       * @example property-example-one
       * 123
       * @example property-example-two
       * 456
       * */
      "property-with-examples": Integer;
      optionalProperty?: string;
      objectProperty: {
        objectProp: string;
      };
      arrayProperty: string[];
      "property.with.dots": string;
    },
    @queryParams
    interfaceQueryParams: IQueryParams,
    @queryParams
    typeAliasTypeLiteralQueryParams: TypeAliasTypeLiteral,
    @queryParams
    typeAliasTypeReferenceQueryParams: TypeAliasTypeReference,
    @queryParams
    nonObjectQueryParams: string,
    @queryParams
    queryParamsWithIllegalPropertyName: {
      "illegal-property-name-%$": string;
    },
    @queryParams
    queryParamsWithEmptyPropertyName: {
      "": string;
    },
    @queryParams
    queryParamsWithIllegalPropertyType: {
      property: null;
    },
    @queryParams
    queryParamsWithIllegalPropertyArrayType: {
      property: null[];
    },
    @queryParams
    queryParamsWithIllegalPropertyObjectType: {
      property: {
        illegalNesting: {
          property: string;
        };
      };
    },
    @queryParams
    optionalQueryParams?: {
      property: string;
    }
  ) {}
}

interface IQueryParams {
  /** property description */
  "property-with-description": string;
}

type TypeAliasTypeLiteral = {
  /** property description */
  "property-with-description": string;
};

type TypeAliasTypeReference = IQueryParams;
