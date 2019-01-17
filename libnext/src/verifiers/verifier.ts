import { ContractNode } from "../models/nodes";
import { verifyApiNode } from "./nodes/api-verifier";
import { verifyEndpointNode } from "./nodes/endpoint-verifier";
import { VerificationError } from "./verification-error";

export function verify(contract: ContractNode): VerificationError[] {
  let errors: VerificationError[] = [];

  errors.push(...verifyApiNode(contract.api.value));

  // TODO: check to make sure endpoints don't have duplicate names
  contract.endpoints.forEach(endpoint =>
    errors.push(...verifyEndpointNode(endpoint.value, contract.types))
  );

  return errors;
}
