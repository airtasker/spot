import { Command, flags } from "@oclif/command";
import { lint } from "../../../lib/src/linting/linter";
import { parse } from "../../../lib/src/parser";
import { findLintViolations } from "../../../lib/src/linting/find-lint-violations";
import { availableRules } from "../../../lib/src/linting/rules";

const ARG_API = "spot_contract";

export interface LintConfig {
  rules: Record<string, string>;
}

const lintConfig: LintConfig = {
  rules: {
    "no-omittable-fields-within-response-bodies": "warn",
    "no-trailing-forward-slash": "warn"
  }
};

/**
 * oclif command to lint a spot contract
 */
export default class Lint extends Command {
  static description = "Lint a Spot contract";

  static examples = [
    "$ spot lint api.ts",
    "$ spot lint --has-descriminator=error",
    "$ spot lint --no-nullable-arrays=off"
  ];

  static args = [
    {
      name: ARG_API,
      required: true,
      description: "path to Spot contract",
      hidden: false
    }
  ];

  static flags = this.buildFlags();

  static buildFlags() {
    // Arguments depend on the list of available rules, it cannot be typed ahead of time.
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const finalFlags: flags.Input<any> = {
      help: flags.help({ char: "h" })
    };

    Object.keys(availableRules).forEach((rule: string) => {
      finalFlags[rule] = flags.enum({
        description: `Setting for ${rule}`,
        options: ["error", "warn", "off"]
      });
    });

    return finalFlags;
  }

  async run(): Promise<void> {
    const { args, flags } = this.parse(Lint);
    const contractPath = args[ARG_API];
    const contract = parse(contractPath);
    const groupedLintErrors = lint(contract);

    Object.keys(availableRules).forEach((rule: string) => {
      if (flags[rule] !== undefined) {
        lintConfig.rules[rule] = flags[rule];
      }
    });

    const { errorCount, warningCount } = findLintViolations(
      groupedLintErrors,
      lintConfig,
      {
        error: (msg: string) => {
          this.error(msg, { exit: false });
        },
        warn: this.warn
      }
    );

    this.log(`Found ${errorCount} errors and ${warningCount} warnings`);

    if (errorCount > 0) {
      process.exit(1);
    }
  }
}
