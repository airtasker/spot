import { createHash } from "crypto";
import { ContractDefinition } from "../models/definitions";

export function hashContractDefinition(
  contractDefinition: ContractDefinition
): string {
  const contractDefinitionString = JSON.stringify(contractDefinition);

  const hash = createHash("sha1")
    .update(contractDefinitionString)
    .digest("hex");

  return hash;
}
