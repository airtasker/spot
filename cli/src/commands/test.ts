import { Command, flags } from "@oclif/command";
import { ContractNode } from "../../../lib/src/models/nodes";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to test a spot contract
 */
export default class Test extends Command {
  static description = "Test a Spot contract";

  static examples = ["$ spot test api.ts"];

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
    const { args } = this.parse(Test);
    const source: ContractNode = safeParse.call(this, args[ARG_API]).source;
  }
}
