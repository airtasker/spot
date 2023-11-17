import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Request types should always be object types
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
