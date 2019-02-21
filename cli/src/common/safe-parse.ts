import { Command } from "@oclif/command";
import { parse } from "../../../lib/src/parsers/parser";
import { verify } from "../../../lib/src/verifiers/verifier";
import { cleanse } from "../../../lib/src/cleansers/cleanser";
import { ContractDefinition } from "../../../lib/src/models/definitions";
import { ContractNode } from "../../../lib/src/models/nodes";

export function safeParse(
  this: Command,
  contractPath: string
): { definition: ContractDefinition; source: ContractNode } {
  try {
    const parsedContract = parse(contractPath);
    const contractErrors = verify(parsedContract);
    if (contractErrors.length > 0) {
      contractErrors.forEach(error => {
        this.error(`${error.location}#${error.line}: ${error.message}`);
      });
      throw new Error("Contract is not valid");
    }
    return {
      definition: cleanse(parsedContract),
      source: parsedContract
    };
  } catch (e) {
    throw this.error(e, { exit: 1 });
  }
}
