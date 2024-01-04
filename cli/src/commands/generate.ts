import { Command, Flags } from "@oclif/core";
import { prompt } from "inquirer";
import YAML from "js-yaml";
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
    help: Flags.help({ char: "h" }),
    contract: Flags.string({
      required: true,
      char: "c",
      description: "Path to a TypeScript Contract definition"
    }),
    language: Flags.string({
      char: "l",
      description: "Language to generate"
    }),
    generator: Flags.string({
      char: "g",
      description: "Generator to run"
    }),
    out: Flags.string({
      char: "o",
      description: "Directory in which to output generated files"
    })
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Generate);
    const { contract: contractPath } = flags;
    let { language, generator, out: outDir } = flags;
    const contractFilename = path.basename(contractPath, ".ts");

    if (!generator) {
      generator = (
        await prompt<{
          Generator: string;
        }>({
          name: "Generator",
          type: "list",
          choices: availableGenerators()
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
          choices: availableFormats(generator)
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

function availableGenerators(): string[] {
  return Object.keys(generators).sort((a, b) => (a > b ? 1 : -1));
}

function availableFormats(generator: string): string[] {
  return Object.keys(generators[generator].formats).sort((a, b) =>
    a > b ? 1 : -1
  );
}

interface Generators {
  [name: string]: Generator;
}

interface Generator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformer: (contract: Contract) => Record<string, any>;
  formats: {
    [name: string]: Format;
  };
}

interface Format {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter: (generatedObject: Record<string, any>) => string;
  extension: string;
}

const jsonFormat: Format = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter: (obj: Record<string, any>) => JSON.stringify(obj, null, 2),
  extension: "json"
};

const yamlFormat: Format = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter: (obj: Record<string, any>) =>
    YAML.dump(obj, { skipInvalid: true /* for undefined */ }),
  extension: "yml"
};

const generators: Generators = {
  raw: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformer: (contract: Contract): Record<string, any> => {
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
