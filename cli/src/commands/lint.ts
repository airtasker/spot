import { Command, flags } from "@oclif/command";
import { lint } from "../../../lib/src/linting/linter";
import { parse } from "../../../lib/src/parser";
import { findLintViolations } from "../../../lib/src/linting/find-lint-violations";

const ARG_API = "spot_contract";

export interface LintConfig {
  rules: Record<string, string>;
}

// TODO: Make it possible to specify by reading a config file
const lintConfig: LintConfig = {
  rules: {
    "no-omittable-fields-within-response-bodies": "warn"
  }
};

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

  async run(): Promise<void> {
    const { args } = this.parse(Lint);
    const contractPath = args[ARG_API];
    const contract = parse(contractPath);
    const groupedLintErrors = lint(contract);

    const { errorCount } = findLintViolations(groupedLintErrors, lintConfig, {
      error: (msg: string) => {
        this.error(msg, { exit: false });
      },
      warn: this.warn
    });

    if (errorCount > 0) {
      process.exit(1);
    }
  }
}
