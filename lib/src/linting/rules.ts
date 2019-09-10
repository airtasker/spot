import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noNestedTypesWithinUnions } from "./rules/no-nested-types-within-unions";
import { noNullableArrays } from "./rules/no-nullable-arrays";
import { noNullableFieldsWithinRequests } from "./rules/no-nullable-fields-within-requests";
import { noObjectsInQueryParams } from "./rules/no-objects-in-query-params";
import { noOmittableFieldsWithinResponses } from "./rules/no-omittable-fields-within-responses";
import { oneSuccessResponsePerEndpoint } from "./rules/one-success-response-per-endpoint";

export const availableRules = {
  "has-discriminator": hasDiscriminator,
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "no-nested-types-within-unions": noNestedTypesWithinUnions,
  "no-nullable-arrays": noNullableArrays,
  "no-nullable-fields-within-requests": noNullableFieldsWithinRequests,
  "no-objects-in-query-params": noObjectsInQueryParams,
  "no-omittable-fields-within-responses": noOmittableFieldsWithinResponses,
  "one-success-response-per-endpoint": oneSuccessResponsePerEndpoint
};

export type RuleName = keyof typeof availableRules;
