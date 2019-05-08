import { ContractNode } from "../models/nodes";
import { verifyApiNode } from "./nodes/api-verifier";
import { verifyEndpointNode } from "./nodes/endpoint-verifier";
import { verifyUniqueEndpointNames } from "./unicity/endpoints";
import { verifyUniqueTypeNames } from "./unicity/types";
import { VerificationError } from "./verification-error";

export function verify(contract: ContractNode): VerificationError[] {
  const errors: VerificationError[] = [];

  errors.push(...verifyApiNode(contract.api.value, contract.types));

  contract.endpoints.forEach(endpoint =>
    errors.push(...verifyEndpointNode(endpoint.value, contract.types))
  );

  errors.push(...verifyUniqueEndpointNames(contract));
  errors.push(...verifyUniqueTypeNames(contract));

  return errors;
}
