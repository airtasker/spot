import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that all defined endpoints have at least one response.
 *
 * @param contract a contract
 */
export function hasResponse(contract: Contract): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints
    .filter(
      endpoint =>
        endpoint.responses.length === 0 &&
        endpoint.defaultResponse === undefined
    )
    .forEach(endpoint => {
      violations.push({
        message: `Endpoint (${endpoint.name}) does not declare any response`
      });
    });

  return violations;
}
