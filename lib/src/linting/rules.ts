import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noNestedTypesWithinUnions } from "./rules/no-nested-types-within-unions";
import { noNullableArrays } from "./rules/no-nullable-arrays";
import { noOmittableFieldsWithinResponses } from "./rules/no-omittable-fields-within-responses";
import { oneSuccessResponsePerEndpoint } from "./rules/one-success-response-per-endpoint";

export const availableRules = {
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "has-discriminator": hasDiscriminator,
  "no-nested-types-within-unions": noNestedTypesWithinUnions,
  "no-nullable-arrays": noNullableArrays,
  "no-omittable-fields-within-responses": noOmittableFieldsWithinResponses,
  "one-success-response-per-endpoint": oneSuccessResponsePerEndpoint
};

export type RuleName = keyof typeof availableRules;
