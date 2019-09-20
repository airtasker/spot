import { Command, flags } from "@oclif/command";
import { startValidationServer } from "../../../lib/src/validation-server/server";
import { parse } from "../../../lib/src/neu/parser";
import { outputFile } from "../../../lib/src/io/output";

const ARG_API = "spot_contract";

/**
 * oclif command to start the spot contract validation server
 */
export default class Serve extends Command {
  static description = "Start the spot contract validation server";

  static examples = ["$ spot serve api.ts"];

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
    const { args, flags } = this.parse(Serve);
    const contractPath = args[ARG_API];
    const { port } = flags;

    this.log("Generating raw contract...");
    const rawContract = JSON.stringify(parse(contractPath));
    this.debug("Outputing raw contract to ./spot");
    outputFile(".spot", "raw.json", rawContract, true);

    this.log("Starting spot validation server...");
    startValidationServer(port);
  }
}
