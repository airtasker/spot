import { Command, flags } from "@oclif/command";

const ARG_API = "spot_contract";

/**
 * oclif command to start the validation server for spot contracts
 */
export default class Serve extends Command {
  static description = "Validate a Spot contract";

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
    port: flags.string({
      char: "p",
      default: "5907",
      description: "The port where application will be available"
    })
  };

  async run() {
    const { args, flags } = this.parse(Serve);
    const { port } = flags;
    this.log("Running spot serve " + args[ARG_API] + " -p " + port);
  }
}
