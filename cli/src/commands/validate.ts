import { Command, flags } from "@oclif/command";
import { parsePath } from "../../../lib/src/parsing/file-parser";

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
      await parsePath(args[ARG_API]);
      this.log("Spot contract is valid");
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
