import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that no endpoint is defined with a path that contains a trailing
 * forward slash.
 *
 * @param contract a contract
 */
export function noTrailingForwardSlash(
  contract: Contract
): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    const { path } = endpoint;

    if (path.match(/\/$/)) {
      violations.push({
        message: `Endpoint (${endpoint.name} ${path}) contains a trailing forward slash`
      });
    }
  });

  return violations;
}
