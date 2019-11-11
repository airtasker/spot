import { Command, flags } from "@oclif/command";
import { prompt } from "inquirer";
import sortBy from "lodash/sortBy";
import path from "path";
import { generateJsonSchema } from "../../../lib/src/generators/contract/json-schema";
import { generateOpenApiV2 } from "../../../lib/src/generators/contract/openapi2";
import { generateOpenApiV3 } from "../../../lib/src/generators/contract/openapi3";
import { outputFile } from "../../../lib/src/io/output";
import { ContractDefinition } from "../../../lib/src/models/definitions";
import { parse } from "../../../lib/src/neu/parser";
import { safeParse } from "../common/safe-parse";

export default class Generate extends Command {
  static description =
    "Runs a generator on an API. Used to produce client libraries, server boilerplates and well-known API contract formats such as OpenAPI.";

  static examples = [
    `$ spot generate --contract api.ts --language yaml --generator openapi3 --out output/`
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    contract: flags.string({
      required: true,
      char: "c",
      description: "Path to a TypeScript Contract definition"
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
    // tslint:disable-next-line:prefer-const
    let { contract: contractPath, language, generator, out: outDir } = flags;
    const contractFilename = path.basename(contractPath, ".ts");
    if (!generator) {
      generator = (
        await prompt<{
          Generator: string;
        }>({
          name: "Generator",
          type: "list",
          choices: sortBy(Object.keys(generators))
        })
      ).Generator;
    }
    if (!generators[generator]) {
      this.error(
        `No such generator ${generator}. Available generators:\n${availableGeneratorsList()}`
      );
      this.exit(1);
    }
    if (!language) {
      language = (
        await prompt<{
          Language: string;
        }>({
          name: "Language",
          type: "list",
          choices: sortBy(Object.keys(generators[generator]))
        })
      ).Language;
    }
    if (!outDir) {
      outDir = (
        await prompt<{
          "Output destination": string;
        }>({
          name: "Output destination",
          default: "."
        })
      )["Output destination"];
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

    const generatedFiles =
      generator === "raw"
        ? { "*.json": JSON.stringify(parse(contractPath)) }
        : generators[generator][language](
            safeParse.call(this, contractPath).definition
          );
    for (let [relativePath, content] of Object.entries(generatedFiles)) {
      if (relativePath.indexOf("*") !== -1) {
        relativePath = relativePath.replace(/\*/g, contractFilename);
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
      contract: ContractDefinition
    ) => {
      [relativePath: string]: string;
    };
  };
} = {
  raw: {
    json: contract => ({
      "*.json": "dummy" // TODO consolidate with other generaters
    })
  },
  "json-schema": {
    json: contract => ({
      "*.json": generateJsonSchema(contract, "json")
    }),
    yaml: contract => ({
      "*.yml": generateJsonSchema(contract, "yaml")
    })
  },
  openapi2: {
    json: contract => ({
      "*.json": generateOpenApiV2(contract, "json")
    }),
    yaml: contract => ({
      "*.yml": generateOpenApiV2(contract, "yaml")
    })
  },
  openapi3: {
    json: contract => ({
      "*.json": generateOpenApiV3(contract, "json")
    }),
    yaml: contract => ({
      "*.yml": generateOpenApiV3(contract, "yaml")
    })
  }
};
