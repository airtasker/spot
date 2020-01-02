import assertNever from "assert-never";
import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that endpoint request body's conform to HTTP method semantics:
 * - GET and DELETE  requests MUST NOT contain a request body
 * - POST | PATCH | PUT requests MUST contain a request body
 *
 * @param contract a contract
 */
export function hasRequestPayload(contract: Contract): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    switch (endpoint.method) {
      case "GET":
      case "HEAD":
      case "DELETE":
        if (endpoint.request && endpoint.request.body) {
          violations.push({
            message: `Endpoint (${endpoint.name}) with HTTP method ${endpoint.method} must not contain a request body`
          });
        }
        break;
      case "POST":
      case "PATCH":
      case "PUT":
        if (!(endpoint.request && endpoint.request.body)) {
          violations.push({
            message: `Endpoint (${endpoint.name}) with HTTP method ${endpoint.method} must contain a request body`
          });
        }
        break;
      default:
        assertNever(endpoint.method);
    }
  });

  return violations;
}
