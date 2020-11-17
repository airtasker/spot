import { body } from "@airtasker/spot";

class BodyClass {
  bodyMethod(
    notBody: string,
    @body body: string,
    /** Body description */
    @body bodyWithDescription: string,
    @body intersectionTypeBody: TypeAliasIntersection,
    @body optionalBody?: string
  ) {}
}

type TypeAliasTypeLiteral = {
  /** property description */
  "property-with-description": string;
};

type TypeAliasTypeLiteral2 = {
  /** property description */
  "property-2-with-description": string;
};

type TypeAliasIntersection = TypeAliasTypeLiteral & TypeAliasTypeLiteral2;
