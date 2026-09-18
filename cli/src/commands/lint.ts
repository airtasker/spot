import { Args, Command, Flags, Interfaces } from "@oclif/core";
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

  static args = {
    [ARG_API]: Args.string({
      required: true,
      description: "path to Spot contract",
      hidden: false
    })
  };

  static flags = this.buildFlags();

  static buildFlags() {
    // The rules are only known at runtime, but the values are still flags:
    // `FlagInput` rejects a flag *factory*, which is what `Flags.option`
    // returns and what silently broke this command once already.
    const finalFlags: Interfaces.FlagInput = {
      help: Flags.help({ char: "h" })
    };

    Object.keys(availableRules).forEach((rule: string) => {
      // A string flag restricted by `options` is what v1's `flags.enum` was.
      finalFlags[rule] = Flags.string({
        description: `Setting for ${rule}`,
        options: ["error", "warn", "off"]
      });
    });

    return finalFlags;
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Lint);
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
        // Wrapped rather than passed by reference: `Command.warn` reads
        // `this.jsonEnabled()`, so handing the bare method to a caller that
        // invokes it off a plain object throws before it can warn.
        warn: (msg: string) => {
          this.warn(msg);
        }
      }
    );

    this.log(`Found ${errorCount} errors and ${warningCount} warnings`);

    if (errorCount > 0) {
      process.exit(1);
    }
  }
}
