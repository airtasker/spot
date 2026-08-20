import { Args, Command, Flags } from "@oclif/core";
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

  static args = {
    [ARG_DIR]: Args.string({
      required: false,
      default: ".",
      description: "directory to check",
      hidden: false
    })
  };

  static flags = {
    help: Flags.help({ char: "h" }),
    fix: Flags.boolean({
      description: "Reformat and apply lint fixes in place",
      default: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TsLint);

    const { report, fixed, ok } = await tsLint(args[ARG_DIR], {
      fix: flags.fix
    });

    fixed.forEach(file => this.log(`Fixed ${file}`));
    report.forEach(line => this.log(line));

    // Only claim the tree is clean when there is nothing to show. A report can
    // be non-empty on a passing run — warnings do not fail the command — and
    // printing both the findings and "No problems found" contradicts itself.
    if (ok && report.length === 0) {
      this.log("No problems found");
    }

    if (!ok) {
      // Not process.exit: this.log writes to stdout, which is asynchronous
      // when stdout is a pipe — every CI runner — and exiting outright
      // truncates the report mid-stream. Setting the code lets Node flush and
      // exit on its own.
      process.exitCode = 1;
    }
  }
}
