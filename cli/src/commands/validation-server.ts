import { Args, Command, Flags } from "@oclif/core";
import { parse } from "../../../lib/src/parser";
import { runValidationServer } from "../../../lib/src/validation-server/server";

const ARG_API = "spot_contract";

/**
 * Machine-parsed readiness signal. Downstream builds block on this exact prefix
 * before they run against the server, and a build that never sees it waits until
 * it times out with nothing else to go on — so the string is a wire contract,
 * not log text. Pinned by a spec for that reason.
 */
export const READY_LINE_PREFIX = "Validation server running";

/**
 * oclif command to start the spot contract validation server
 */
export default class ValidationServer extends Command {
  static description = "Start the spot contract validation server";

  static examples = ["$ spot validation-server api.ts"];

  static args = {
    [ARG_API]: Args.string({
      required: true,
      description: "path to Spot contract",
      hidden: false
    })
  };

  static flags = {
    help: Flags.help({ char: "h" }),
    port: Flags.integer({
      char: "p",
      default: 5907,
      description: "The port where application will be available"
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ValidationServer);
    const contractPath = args[ARG_API];
    const { port } = flags;

    try {
      this.log("Parsing contract...");
      const contract = parse(contractPath);

      this.log("Starting validation server...");
      await runValidationServer(port, contract).defer();
      this.log(`${READY_LINE_PREFIX} on port ${port}`);
    } catch (e) {
      this.error(e as Error, { exit: 1 });
    }
  }
}
