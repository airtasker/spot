import { Command, flags } from "@oclif/command";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to validate a spot contract
 */
export default class Validate extends Command {
  public static description = "Validate a Spot contract";

  public static examples = ["$ spot validate api.ts"];

  public static args = [
    {
      name: ARG_API,
      required: true,
      description: "path to Spot contract",
      hidden: false
    }
  ];

  public static flags = {
    help: flags.help({ char: "h" })
  };

  public async run() {
    const { args } = this.parse(Validate);
    const contract = safeParse.call(this, args[ARG_API]).definition;
    this.log("Contract is valid");
  }
}
