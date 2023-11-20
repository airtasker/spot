import { LintingRule } from "./rule";
import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponse } from "./rules/has-response";
import { hasResponsePayload } from "./rules/has-response-payload";
import { noInlineObjectsWithinUnions } from "./rules/no-inline-objects-within-unions";
import { noNullableArrays } from "./rules/no-nullable-arrays";
import { noNullableFieldsWithinRequestBodies } from "./rules/no-nullable-fields-within-request-bodies";
import { noOmittableFieldsWithinResponseBodies } from "./rules/no-omittable-fields-within-response-bodies";
import { noTrailingForwardSlash } from "./rules/no-trailing-forward-slash";

export const availableRules: LintingRules = {
  "has-discriminator": hasDiscriminator,
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "has-response": hasResponse,
  "no-inline-objects-within-unions": noInlineObjectsWithinUnions,
  "no-nullable-arrays": noNullableArrays,
  "no-nullable-fields-within-request-bodies":
    noNullableFieldsWithinRequestBodies,
  "no-omittable-fields-within-response-bodies":
    noOmittableFieldsWithinResponseBodies,
  "no-trailing-forward-slash": noTrailingForwardSlash
};

interface LintingRules {
  [rule: string]: LintingRule;
}
