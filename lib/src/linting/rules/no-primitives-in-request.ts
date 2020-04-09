import { Contract } from "../../definitions";
import { LintingRuleViolation } from "../rule";
import { dereferenceType, TypeTable, isObjectType } from "../../types";

/**
 * Request types should always be object types
 *
 * @param contract a contract
 */
export function noPrimitivesInRequest(
  contract: Contract
): LintingRuleViolation[] {
  const violations: LintingRuleViolation[] = [];
  const typeTable = TypeTable.fromArray(contract.types);

  contract.endpoints.forEach(endpoint => {
    const { request } = endpoint;
    const body = request && request.body;
    if (!body) {
      return;
    }
    const bodyType = dereferenceType(body.type, typeTable);

    if (!isObjectType(bodyType)) {
      violations.push({
        message: `Endpoint (${endpoint.name}) must contain a request as an object`
      });
    }
  });

  return violations;
}
