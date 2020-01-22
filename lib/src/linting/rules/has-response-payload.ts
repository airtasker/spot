import {
  Contract,
  DefaultResponse,
  Endpoint,
  isSpecificResponse,
  Response
} from "../../definitions";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that all defined responses have a response body.
 *
 * @param contract a contract
 */
export function hasResponsePayload(contract: Contract): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    findResponses(endpoint)
      .filter(response => response.body === undefined)
      .forEach(responseWithNoBody => {
        const responseIdentifier = isSpecificResponse(responseWithNoBody)
          ? `response for status ${responseWithNoBody.status}`
          : "default response";

        violations.push({
          message: `Endpoint (${endpoint.name}) ${responseIdentifier} is missing a response body`
        });
      });
  });

  return violations;
}

function findResponses(endpoint: Endpoint): Array<DefaultResponse | Response> {
  return [
    ...endpoint.responses,
    ...(endpoint.defaultResponse ? [endpoint.defaultResponse] : [])
  ];
}
