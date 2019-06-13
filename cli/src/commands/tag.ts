import { Command, flags } from "@oclif/command";
import { hashContractDefinition } from "../../../lib/src/tagging/hash";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to generate a tag based on a Spot contract
 */
export default class Tag extends Command {
  static description = "Generate a version tag based on a Spot contract";

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
    algorithm: flags.string({
      description: "digest algorithm used to generate the hash"
    })
  };

  async run() {
    const {
      args,
      flags: { algorithm }
    } = this.parse(Tag);
    try {
      const contract = safeParse.call(this, args[ARG_API]).definition;
      const hash = hashContractDefinition(contract, { algorithm });
      this.log(hash);
    } catch (e) {
      this.error(e, { exit: 1 });
    }
  }
}
