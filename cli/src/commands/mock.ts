import { Command, flags } from "@oclif/command";
import { runMockServer } from "../../../lib/src/mockserver/server";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to run a mock server based on a Spot contract
 */
export default class Mock extends Command {
  public static description = "Run a mock server based on a Spot contract";

  public static examples = ["$ spot mock api.ts"];

  public static args = [
    {
      name: ARG_API,
      required: true,
      description: "path to Spot contract",
      hidden: false
    }
  ];

  public static flags = {
    help: flags.help({ char: "h" }),
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

  public async run() {
    const {
      args,
      flags: { port, pathPrefix }
    } = this.parse(Mock);
    try {
      const contract = safeParse.call(this, args[ARG_API]).definition;
      await runMockServer(contract, {
        port,
        pathPrefix: pathPrefix || "",
        logger: this
      });
      this.log(`Mock server is running on port ${port}.`);
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
