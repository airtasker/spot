import { Command, flags } from "@oclif/command";
import { prompt } from "inquirer";
import YAML from "js-yaml";
import sortBy from "lodash/sortBy";
import path from "path";
import { Contract } from "../../../lib/src/definitions";
import { generateJsonSchema } from "../../../lib/src/generators/json-schema/json-schema";
import { generateOpenAPI2 } from "../../../lib/src/generators/openapi2/openapi2";
import { generateOpenAPI3 } from "../../../lib/src/generators/openapi3/openapi3";
import { outputFile } from "../../../lib/src/io/output";
import { parse } from "../../../lib/src/parser";

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
          choices: sortBy(availableGenerators())
        })
      ).Generator;
    }

    if (!availableGenerators().includes(generator)) {
      const generatorList = availableGenerators()
        .map(g => `- ${g}`)
        .join("\n");

      this.error(
        `No such generator ${generator}. Available generators:\n${generatorList}`,
        { exit: 1 }
      );
    }

    if (!language) {
      language = (
        await prompt<{
          Language: string;
        }>({
          name: "Language",
          type: "list",
          choices: sortBy(availableFormats(generator))
        })
      ).Language;
    }

    if (!availableFormats(generator).includes(language)) {
      const formatsList = availableFormats(generator)
        .map(f => `- ${f}`)
        .join("\n");

      this.error(
        `Language ${language} is unsupported for the generator ${generator}. Supported languages:\n${formatsList}`,
        { exit: 1 }
      );
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

    const generatorTransformer = generators[generator].transformer;
    const formatTransformer = generators[generator].formats[language].formatter;
    const formatExtension = generators[generator].formats[language].extension;

    const transformedContract = generatorTransformer(parse(contractPath));
    const formattedContract = formatTransformer(transformedContract);

    outputFile(
      outDir,
      `${contractFilename}.${formatExtension}`,
      formattedContract
    );
  }
}

function availableGenerators() {
  return Object.keys(generators);
}

function availableFormats(generator: string) {
  return Object.keys(generators[generator].formats);
}

interface Generators {
  [name: string]: Generator;
}

interface Generator {
  transformer: (contract: Contract) => Object;
  formats: {
    [name: string]: Format;
  };
}

interface Format {
  formatter: (generatedObject: Object) => string;
  extension: string;
}

const jsonFormat: Format = {
  formatter: (obj: Object) => JSON.stringify(obj, null, 2),
  extension: "json"
};

const yamlFormat: Format = {
  formatter: (obj: Object) =>
    YAML.safeDump(obj, { skipInvalid: true /* for undefined */ }),
  extension: "yml"
};

const generators: Generators = {
  raw: {
    transformer: (contract: Contract) => {
      return contract;
    },
    formats: {
      json: jsonFormat
    }
  },
  "json-schema": {
    transformer: generateJsonSchema,
    formats: {
      json: jsonFormat,
      yaml: yamlFormat
    }
  },
  openapi2: {
    transformer: generateOpenAPI2,
    formats: {
      json: jsonFormat,
      yaml: yamlFormat
    }
  },
  openapi3: {
    transformer: generateOpenAPI3,
    formats: {
      json: jsonFormat,
      yaml: yamlFormat
    }
  }
};
