import { createHash } from "crypto";
import { ContractDefinition } from "../models/definitions";

export function hashContractDefinition(
  contractDefinition: ContractDefinition
): string {
  // Remove unnecessary whitespace and aim to make the output JSON-formatting independent.
  const contractDefinitionString = JSON.stringify(contractDefinition).replace(
    /\s/g,
    ""
  );

  const hash = createHash("sha1")
    .update(contractDefinitionString)
    .digest("hex");

  return hash;
}
