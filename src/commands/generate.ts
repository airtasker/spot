import { Command, flags } from "@oclif/command";
import * as fs from "fs-extra";
import * as path from "path";
import { generateJsonSchema } from "../../lib/src/generators/contract/json-schema";
import { generateOpenApiV3 } from "../../lib/src/generators/contract/openapi-3";
import { generateAxiosClientSource } from "../../lib/src/generators/typescript/axios-client";
import { generateEndpointHandlerSource, generateExpressServerSource } from "../../lib/src/generators/typescript/express-server";
import { generateTypesSource } from "../../lib/src/generators/typescript/types";
import { generateValidatorsSource } from "../../lib/src/generators/typescript/validators";
import { Api } from "../../lib/src/models";
import { parsePath } from "../../lib/src/parser";

export default class Generate extends Command {
  static description = "describe the command here";

  static examples = [
    `$ api generate --language typescript --generator axios-client --out src/
Generated the following files:
- src/types.ts
- src/validators.ts
- src/client.ts
`
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    api: flags.string({
      required: true,
      char: "a",
      description: "Path to a TypeScript API definition"
    }),
    language: flags.string({
      required: true,
      char: "l",
      description: "Language to generate"
    }),
    generator: flags.string({
      required: true,
      char: "g",
      description: "Generator to run"
    }),
    out: flags.string({
      required: true,
      char: "o",
      description: "Directory in which to output generated files"
    })
  };

  async run() {
    const { flags } = this.parse(Generate);
    const { api: apiPath, language, generator, out: outDir } = flags;
    const api = await parsePath(apiPath);
    if (!generators[generator]) {
      this.error(`No such generator ${generator}`);
      this.exit(1);
    }
    if (!generators[generator][language]) {
      this.error(
        `Unsupported language for generator ${generator}: ${language}`
      );
      this.exit(1);
    }
    const generatedFiles = generators[generator][language](api);
    for (const [relativePath, content] of Object.entries(generatedFiles)) {
      outputFile(outDir, relativePath, content);
    }
    this.log(`Generated the following files:`);
    Object.keys(generatedFiles).forEach(relativePath =>
      this.log(`- ${path.join(outDir, relativePath)}`)
    );
  }
}

const generators: {
  [generatorName: string]: {
    [languageName: string]: (
      api: Api
    ) => {
      [relativePath: string]: string;
    };
  };
} = {
  "json-schema": {
    json: api => ({
      "types.json": generateJsonSchema(api, "json")
    }),
    yaml: api => ({
      "types.yml": generateJsonSchema(api, "yaml")
    })
  },
  "openapi-3": {
    json: api => ({
      "api.json": generateOpenApiV3(api, "json")
    }),
    yaml: api => ({
      "api.yml": generateOpenApiV3(api, "yaml")
    })
  },
  "axios-client": {
    typescript: api => ({
      "types.ts": generateTypesSource(api),
      "validators.ts": generateValidatorsSource(api),
      "client.ts": generateAxiosClientSource(api)
    })
  },
  "express-server": {
    typescript: api => ({
      "types.ts": generateTypesSource(api),
      "validators.ts": generateValidatorsSource(api),
      "server.ts": generateExpressServerSource(api),
      ...Object.entries(api.endpoints).reduce(
        (acc, [endpointName, endpoint]) => {
          acc[`endpoints/${endpointName}.ts`] = generateEndpointHandlerSource(
            api,
            endpointName,
            endpoint
          );
          return acc;
        },
        {} as { [relativePath: string]: string }
      )
    })
  }
};

function outputFile(outDir: string, relativePath: string, content: string) {
  const destinationPath = path.join(outDir, relativePath);
  fs.mkdirpSync(path.dirname(destinationPath));
  fs.writeFileSync(destinationPath, content, "utf8");
}
