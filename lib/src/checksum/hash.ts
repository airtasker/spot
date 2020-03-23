import { createHash } from "crypto";
import { Contract } from "../definitions";

export function hashContract(contract: Contract): string {
  const contractDefinitionString = JSON.stringify(contract);

  return createHash("sha1").update(contractDefinitionString).digest("hex");
}
