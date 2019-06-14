import { Command, flags } from "@oclif/command";
import { TestFilter } from "../../../lib/src/testing/common";
import { TestRunner } from "../../../lib/src/testing/test-runner";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to test a spot contract
 */
export default class Test extends Command {
  static description = "Test a Spot contract";

  static examples = [
    "$ spot test api.ts -u http://localhost:3000",
    "$ spot test api.ts -u http://localhost:3000 -s http://localhost:3000/spot",
    "$ spot test api.ts -u http://localhost:3000 -t MyEndpoint:myTest"
  ];

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
    debug: flags.boolean({ description: "Enable debug logs" }),
    url: flags.string({
      required: true,
      char: "u",
      description: "Base URL"
    }),
    stateUrl: flags.string({
      char: "s",
      description: "Base URL for state changes"
    }),
    testFilter: flags.string({
      char: "t",
      description: "Filter by endpoint and test"
    })
  };

  async run() {
    const { args, flags } = this.parse(Test);
    const { url: baseUrl, stateUrl: baseStateUrl, testFilter, debug } = flags;
    const { definition } = safeParse.call(this, args[ARG_API]);

    const testRunnerConfig = {
      baseStateUrl: baseStateUrl ? baseStateUrl : `${baseUrl}/state`,
      baseUrl,
      debugMode: debug
    };
    const testConfig = {
      testFilter: testFilter ? parseTestFilter(testFilter) : undefined
    };

    const testRunner = new TestRunner(testRunnerConfig);
    const passed = await testRunner.test(definition, testConfig);

    if (!passed) {
      this.exit(1);
    }
  }
}

function parseTestFilter(rawTestFilter: string): TestFilter {
  const [specificEndpoint, specificTest] = rawTestFilter.split(":");
  return {
    endpoint: specificEndpoint,
    test: specificTest
  };
}
