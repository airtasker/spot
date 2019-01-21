import { Command, flags } from "@oclif/command";
import { parse } from "../../../lib/src/parsers/parser";
import { verify } from "../../../lib/src/verifiers/verifier";

const ARG_API = "spot_contract";

/**
 * oclif command to validate a spot contract
 */
export default class Validate extends Command {
  static description = "Validate a Spot contract";

  static examples = ["$ spot validate api.ts"];

  static args = [
    {
      name: ARG_API,
      required: true,
      description: "path to Spot contract",
      hidden: false
    }
  ];

  static flags = {
    help: flags.help({ char: "h" })
  };

  async run() {
    const { args } = this.parse(Validate);
    try {
      const parsedContract = parse(args[ARG_API]);
      const contractErrors = verify(parsedContract);
      if (contractErrors.length > 0) {
        contractErrors.forEach(error => {
          console.log(`${error.location}#${error.line}: ${error.message}`);
        });
        throw new Error("Contract is not valid");
      }
      this.log("Spot contract is valid");
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
