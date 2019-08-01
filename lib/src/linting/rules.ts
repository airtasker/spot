import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noNestedTypesWithinUnions } from "./rules/no-nested-types-within-unions";
import { noOmittableFieldsWithinResponses } from "./rules/no-omittable-fields-within-responses";

export const availableRules = {
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "has-discriminator": hasDiscriminator,
  "no-nested-types-within-unions": noNestedTypesWithinUnions,
  "no-omittable-fields-within-responses": noOmittableFieldsWithinResponses
};

export type RuleName = keyof typeof availableRules;
