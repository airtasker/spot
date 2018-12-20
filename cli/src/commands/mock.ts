import { Command, flags } from "@oclif/command";
import { runMockServer } from "../../../lib/src/mockserver/server";
import { parsePath } from "../../../lib/src/parsing/file-parser";

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
      flags: { port, pathPrefix }
    } = this.parse(Mock);
    try {
      const api = await parsePath(args[ARG_API]);
      await runMockServer(api, {
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
