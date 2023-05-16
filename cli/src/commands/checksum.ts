import { Command, flags } from "@oclif/command";
import { hashContract } from "../../../lib/src/checksum/hash";
import { parse } from "../../../lib/src/parser";

const ARG_API = "spot_contract";

/**
 * oclif command to generate a checksum for a Spot contract
 */
export default class Checksum extends Command {
  static description = "Generate a checksum for a Spot contract";

  static examples = ["$ spot checksum api.ts"];

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

  async run(): Promise<void> {
    const { args } = this.parse(Checksum);
    try {
      const contract = parse(args[ARG_API]);
      const hash = hashContract(contract);
      this.log(hash);
    } catch (e) {
      this.error(e as Error, { exit: 1 });
    }
  }
}
