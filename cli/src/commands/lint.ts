import { Command, flags } from "@oclif/command";
import { lint } from "../../../lib/src/linting/linter";
import { parse } from "../../../lib/src/parser";

const ARG_API = "spot_contract";

/**
 * oclif command to lint a spot contract
 */
export default class Lint extends Command {
  static description = "Lint a Spot contract";

  static examples = ["$ spot lint api.ts"];

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
    const { args } = this.parse(Lint);
    const contractPath = args[ARG_API];
    const contract = parse(contractPath);
    // TODO: Make it possible to specify with a config file which lint rules to enable.
    const lintingErrors = lint(contract);
    const deferExit = lintingErrors.length > 0;

    lintingErrors.forEach(error => {
      this.error(error.message, { exit: false });
    });

    if (deferExit) {
      process.exit(1);
    }
  }
}
