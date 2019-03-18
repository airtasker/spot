import { Command, flags } from "@oclif/command";
import { safeParse } from "../common/safe-parse";
import { runTest } from "../test-utils/test-runner";

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
    help: flags.help({ char: "h" }),
    url: flags.string({
      required: true,
      char: "u",
      description: "Base URL"
    }),
    stateUrl: flags.string({
      char: "s",
      description: "State change URL"
    }),
    testFilter: flags.string({
      char: "t",
      description: "Filter by endpoint and test"
    })
  };

  async run() {
    const { args, flags } = this.parse(Test);
    const { url: baseUrl, stateUrl, testFilter } = flags;
    const { definition } = safeParse.call(this, args[ARG_API]);

    const resolvedStateUrl = stateUrl ? stateUrl : `${baseUrl}/state`;

    const allPassed = await runTest(
      definition,
      testFilter,
      resolvedStateUrl,
      baseUrl
    );

    if (!allPassed) {
      this.exit(1);
    }
  }
}
