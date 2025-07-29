import { Command, flags } from "@oclif/command";
import express from "express";
import path from "path";
import { generateOpenAPI3 } from "../../../lib/src/generators/openapi3/openapi3";
import { parse } from "../../../lib/src/parser";

const ARG_API = "spot_contract";

export default class Docs extends Command {
  static description =
    "Preview Spot contract as OpenAPI3 documentation. The documentation server will start on http://localhost:8080.";

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

  async run(): Promise<void> {
    const { args, flags } = this.parse(Docs);
    const { port } = flags;

    const server = express();
    const docsDir = path.join(__dirname, "docs", "public");
    server.use(express.static(docsDir));

    /**
     * This endpoint is used by the following React Component:
     *   <RedocStandalone specUrl="/contract-openapi3" />
     * The contract is regenerated on each invocation (browser refresh)
     */
    server.get("/contract-openapi3", (req, res) => {
      const contract = parse(args[ARG_API]);
      const openApiObj = generateOpenAPI3(contract);
      res.send(openApiObj);
    });

    const start = async (): Promise<void> => {
      try {
        this.log(`Documentation server started on port ${port}`);
        this.log(`Open http://localhost:${port} to view documentation`);
        await server.listen(port);
      } catch (err) {
        this.error(err as Error, { exit: 1 });
      }
    };
    start();
  }
}
