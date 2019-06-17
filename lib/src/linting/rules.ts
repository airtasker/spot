import { hasDiscriminator } from "./rules/has-discriminator";
import { hasRequestPayload } from "./rules/has-request-payload";
import { hasResponsePayload } from "./rules/has-response-payload";

export const availableRules = {
  "has-request-payload": hasRequestPayload,
  "has-response-payload": hasResponsePayload,
  "has-discriminator": hasDiscriminator
  // TODO: Second rule to ensure no nested types in unions.
};

export type RuleName = keyof typeof availableRules;
