import { Command, flags } from "@oclif/command";
import express from "express";
import path from "path";
import { generateOpenApiV3 } from "../../../lib/src/generators/contract/openapi3";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

export default class Docs extends Command {
  static description = "Preview Spot contract documentation";

  static examples = ["$ spot docs api.ts"];

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
      description: "Documentation server port",
      default: 8080
    })
  };

  async run() {
    const { args, flags } = this.parse(Docs);
    const { port } = flags;

    const server = express();
    const docsDir = path.join(__dirname, "docs", "public");
    server.use(express.static(docsDir));

    server.get("/contract", (req, res) =>
      res.send(
        JSON.parse(
          generateOpenApiV3(
            safeParse.call(this, args[ARG_API]).definition,
            "json"
          )
        )
      )
    );

    const start = async () => {
      try {
        this.log(`Documentation server started on port ${port}`);
        this.log(`Open http://localhost:${port} to view documentation`);
        await server.listen(port);
      } catch (err) {
        process.exit(1);
      }
    };
    start();
  }
}
