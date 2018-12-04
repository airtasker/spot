import { Command, flags } from "@oclif/command";
import { prompt } from "inquirer";
import * as YAML from "js-yaml";
import * as path from "path";
import { generateJsonSchema } from "../../../lib/src/generators/contract/json-schema";
import { generateOpenApiV2 } from "../../../lib/src/generators/contract/openapi2";
import { generateOpenApiV3 } from "../../../lib/src/generators/contract/openapi3";
import { generateAxiosClientSource } from "../../../lib/src/generators/typescript/axios-client";
import {
  generateEndpointHandlerSource,
  generateExpressServerSource
} from "../../../lib/src/generators/typescript/express-server";
import { generateTypesSource } from "../../../lib/src/generators/typescript/types";
import { generateValidatorsSource } from "../../../lib/src/generators/typescript/validators";
import { outputFile } from "../../../lib/src/io/output";
import { Api } from "../../../lib/src/models";
import { parsePath } from "../../../lib/src/parsing/file-parser";
import sortBy = require("lodash/sortBy");

export default class Generate extends Command {
  static description =
    "Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.";

  static examples = [
    `$ spot generate --language typescript --generator axios-client --out src/
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
      char: "l",
      description: "Language to generate"
    }),
    generator: flags.string({
      char: "g",
      description: "Generator to run"
    }),
    out: flags.string({
      char: "o",
      description: "Directory in which to output generated files"
    })
  };

  async run() {
    const { flags } = this.parse(Generate);
    let { api: apiPath, language, generator, out: outDir } = flags;
    const apiFileName = path.basename(apiPath, ".ts");
    const api = await parsePath(apiPath);
    if (!generator) {
      generator = (await prompt<{
        Generator: string;
      }>({
        name: "Generator",
        type: "list",
        choices: sortBy(Object.keys(generators))
      })).Generator;
    }
    if (!generators[generator]) {
      this.error(
        `No such generator ${generator}. Available generators:\n${availableGeneratorsList()}`
      );
      this.exit(1);
    }
    if (!language) {
      language = (await prompt<{
        Language: string;
      }>({
        name: "Language",
        type: "list",
        choices: sortBy(Object.keys(generators[generator]))
      })).Language;
    }
    if (!outDir) {
      outDir = (await prompt<{
        "Output destination": string;
      }>({
        name: "Output destination",
        default: "."
      }))["Output destination"];
    }
    if (!generators[generator][language]) {
      const otherGenerators = Object.entries(generators)
        .filter(([name, languages]) => language! in languages)
        .map(([name, languages]) => name);
      if (otherGenerators.length === 0) {
        this.error(
          `${language} is not supported by any generator. Available generators:\n${availableGeneratorsList()}`
        );
      } else {
        this.error(
          `${language} is not a supported language for this generator.\n\nThe generator ${generator} supports the following languages:\n${Object.keys(
            generators[generator]
          )
            .map(name => `- ${name}`)
            .join(
              "\n"
            )}\n\nOther generators that produce ${language} are available: ${otherGenerators.join(
            ", "
          )}`
        );
      }
      this.exit(1);
    }
    const generatedFiles = generators[generator][language](api);
    for (let [relativePath, content] of Object.entries(generatedFiles)) {
      if (relativePath.indexOf("*") !== -1) {
        relativePath = relativePath.replace(/\*/g, apiFileName);
      }
      outputFile(outDir, relativePath, content);
    }
    this.log(`Generated the following files:`);
    Object.keys(generatedFiles).forEach(relativePath =>
      this.log(`- ${path.join(outDir!, relativePath)}`)
    );
  }
}

function availableGeneratorsList() {
  return Object.entries(generators)
    .map(
      ([name, languages]) => `- ${name} (${Object.keys(languages).join(", ")})`
    )
    .join("\n");
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
  raw: {
    json: api => ({
      "*.json": JSON.stringify(api, null, 2)
    }),
    yaml: api => ({
      "*.yml": YAML.safeDump(api, {
        noRefs: true
      })
    })
  },
  "json-schema": {
    json: api => ({
      "*.json": generateJsonSchema(api, "json")
    }),
    yaml: api => ({
      "*.yml": generateJsonSchema(api, "yaml")
    })
  },
  openapi2: {
    json: api => ({
      "*.json": generateOpenApiV2(api, "json")
    }),
    yaml: api => ({
      "*.yml": generateOpenApiV2(api, "yaml")
    })
  },
  openapi3: {
    json: api => ({
      "*.json": generateOpenApiV3(api, "json")
    }),
    yaml: api => ({
      "*.yml": generateOpenApiV3(api, "yaml")
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
