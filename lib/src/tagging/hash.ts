import { createHash } from "crypto";
import { ContractDefinition } from "../models/definitions";

interface IOptions {
  algorithm?: string
}

export function hashContractDefinition(
  contractDefinition: ContractDefinition,
  options: IOptions,
): string {
  const contractDefinitionString = JSON.stringify(contractDefinition).replace(
    /\s/g,
    ""
  );

  const hash = createHash(options.algorithm || 'sha1')
    .update(contractDefinitionString)
    .digest("hex");

  return hash;
}
