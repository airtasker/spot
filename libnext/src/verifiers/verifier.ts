import { uniq } from "lodash";
import { ContractNode } from "../models/nodes";
import { verifyApiNode } from "./nodes/api-verifier";
import { verifyEndpointNode } from "./nodes/endpoint-verifier";
import { VerificationError } from "./verification-error";

export function verify(contract: ContractNode): VerificationError[] {
  let errors: VerificationError[] = [];

  errors.push(...verifyApiNode(contract.api.value));

  contract.endpoints.forEach(endpoint =>
    errors.push(...verifyEndpointNode(endpoint.value, contract.types))
  );

  // ensure endpoints have unique names
  const endpointNames = contract.endpoints.map(endpoint => endpoint.value.name);
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
