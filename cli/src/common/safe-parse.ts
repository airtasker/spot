import { Command } from "@oclif/command";
import { parse } from "../../../libnext/src/parsers/parser";
import { verify } from "../../../libnext/src/verifiers/verifier";
import { cleanse } from "../../../libnext/src/cleansers/cleanser";
import { ContractDefinition } from "../../../libnext/src/models/definitions";

export function safeParse(
  this: Command,
  contractPath: string
): ContractDefinition {
  try {
    const parsedContract = parse(contractPath);
    const contractErrors = verify(parsedContract);
    if (contractErrors.length > 0) {
      contractErrors.forEach(error => {
        this.error(`${error.location}#${error.line}: ${error.message}`);
      });
      throw new Error("Contract is not valid");
    }
    return cleanse(parsedContract);
  } catch (e) {
    throw this.error(e, { exit: 1 });
  }
}
