import { Command, flags } from "@oclif/command";
import { parse } from "../../../lib/src/neu/parser";
import { Host, runProxyServer } from "../../../lib/src/neu/proxy-server/server";

const ARG_API = "spot_contract";

/**
 * oclif command to start the spot contract proxy server
 */
export default class ProxyServer extends Command {
  static description = "Start the spot contract proxy server";

  static examples = ["$ spot proxy-server api.ts"];

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
      default: 5907,
      description: "The port where application will be available"
    })
  };

  async run() {
    const { args, flags } = this.parse(ProxyServer);
    const contractPath = args[ARG_API];
    const { port } = flags;

    try {
      this.log("Parsing contract...");
      const contract = parse(contractPath);

      this.log("Starting validation server...");

      // TODO: Get this through flags.
      const proxiedHost: Host = {
        scheme: "https",
        hostname: "www.google.com",
        port: 443
      };

      await runProxyServer(port, proxiedHost, contract, this).defer();
      this.log(`Validation server running on port ${port}`);
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
