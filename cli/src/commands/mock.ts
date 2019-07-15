import { Command, flags } from "@oclif/command";
import { runMockServer } from "../../../lib/src/mockserver/server";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to run a mock server based on a Spot contract
 */
export default class Mock extends Command {
  static description = "Run a mock server based on a Spot contract";

  static examples = ["$ spot mock api.ts"];

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
    proxyBaseUrl: flags.string({
      description:
        "If set, the server would act as a proxy and fetch data from the given remote server instead of mocking it"
    }),
    port: flags.integer({
      char: "p",
      description: "Port on which to run the mock server",
      default: 3010,
      required: true
    }),
    pathPrefix: flags.string({
      description: "Prefix to prepend to each endpoint path"
    })
  };

  async run() {
    const {
      args,
      flags: { port, pathPrefix, proxyBaseUrl }
    } = this.parse(Mock);
    try {
      const contract = safeParse.call(this, args[ARG_API]).definition;
      await runMockServer(contract, {
        port,
        pathPrefix: pathPrefix || "",
        proxyBaseUrl,
        logger: this
      });
      this.log(`Mock server is running on port ${port}.`);
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
