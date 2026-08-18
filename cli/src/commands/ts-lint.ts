import { Command, flags } from "@oclif/command";
import { tsLint } from "../../../lib/src/ts-lint/ts-lint";

const ARG_DIR = "directory";

/**
 * oclif command to check a tree of Spot contracts for formatting, lint and
 * type errors, under configuration bundled with Spot itself.
 */
export default class TsLint extends Command {
  static description =
    "Check the TypeScript in a Spot contract tree for formatting, lint and type errors";

  static examples = ["$ spot ts-lint", "$ spot ts-lint spots --fix"];

  static args = [
    {
      name: ARG_DIR,
      required: false,
      default: ".",
      description: "directory to check",
      hidden: false
    }
  ];

  static flags: flags.Input<flags.Output> = {
    help: flags.help({ char: "h" }),
    fix: flags.boolean({
      description: "Reformat and apply lint fixes in place",
      default: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = this.parse(TsLint);

    const { report, fixed, ok } = await tsLint(args[ARG_DIR], {
      fix: flags.fix
    });

    fixed.forEach(file => this.log(`Fixed ${file}`));
    report.forEach(line => this.log(line));

    if (ok) {
      this.log("No problems found");
    } else {
      process.exit(1);
    }
  }
}
