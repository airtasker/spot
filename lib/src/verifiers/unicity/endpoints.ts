import { uniq } from "lodash";
import { ContractNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";

export function verifyUniqueEndpointNames(
  contract: ContractNode
): VerificationError[] {
  const errors: VerificationError[] = [];
  const endpointNames = contract.endpoints.map(
    endpoint => endpoint.value.name.value
  );
  if (uniq(endpointNames).length !== endpointNames.length) {
    errors.push({
      message: "endpoints must have unique names",
      // TODO: use a duplicated endpoint location
      location: contract.api.location,
      line: contract.api.line
    });
  }
  return errors;
}
