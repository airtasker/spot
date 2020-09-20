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
    interfaceHeaders: IHeader,
    @headers
    typeAliasTypeLiteralHeaders: TypeAliasTypeLiteral,
    @headers
    typeAliasTypeReferenceHeaders: TypeAliasTypeReference,
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

interface IHeader {
  /** property description */
  "property-with-description": string;
}

type TypeAliasTypeLiteral = {
  /** property description */
  "property-with-description": string;
};

type TypeAliasTypeReference = IHeader;
