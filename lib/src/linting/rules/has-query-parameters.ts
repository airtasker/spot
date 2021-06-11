import assertNever from "assert-never";
import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that endpoint request payload conform to HTTP method semantics:
 * - PATCH | PUT | POST requests MUST NOT contain query parameters
 *
 * @param contract a contract
 */
export function hasQueryParameters(contract: Contract): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    switch (endpoint.method) {
      case "DELETE":
      case "GET":
      case "HEAD":
        break;
      case "PATCH":
      case "POST":
      case "PUT":
        if (endpoint.request && endpoint.request.queryParams.length > 0) {
          violations.push({
            message: `Endpoint (${endpoint.name}) with HTTP method ${endpoint.method} must not contain query parameters`
          });
        }
        break;
      default:
        assertNever(endpoint.method);
    }
  });

  return violations;
}
