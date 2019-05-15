import { groupBy, keys, pickBy } from "lodash";
import { ContractNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";

export function verifyUniqueEndpointNames(
  contract: ContractNode
): VerificationError[] {
  const errors: VerificationError[] = [];

  const endpointsByName = groupBy(
    contract.endpoints,
    endpoint => endpoint.value.name.value
  );

  const duplicatedEndpoints = pickBy(
    endpointsByName,
    endpointCollection => endpointCollection.length > 1
  );

  keys(duplicatedEndpoints).forEach(endpointName => {
    const firstEndpointWithName = duplicatedEndpoints[endpointName][0];
    errors.push({
      message: `endpoints must have unique names: ${endpointName}`,
      location: firstEndpointWithName.value.name.location,
      line: firstEndpointWithName.value.name.line
    });
  });

  return errors;
}
