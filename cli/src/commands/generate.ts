import { Command, Flags } from "@oclif/core";
import inquirer from "inquirer";
import YAML from "js-yaml";
import path from "path";
import { Contract } from "../../../lib/src/definitions";
import { generateJsonSchema } from "../../../lib/src/generators/json-schema/json-schema";
import { generateOpenAPI2 } from "../../../lib/src/generators/openapi2/openapi2";
import { generateOpenAPI3 } from "../../../lib/src/generators/openapi3/openapi3";
import { outputFile, resolveOutputPath } from "../../../lib/src/io/output";
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
    const { flags } = await this.parse(Generate);
    const { contract: contractPath } = flags;
    let { language, generator, out: outDir } = flags;
    const contractFilename = path.basename(contractPath, ".ts");

    // Each missing flag below falls back to an interactive prompt, reading
    // stdin. With no terminal the answer never arrives, and how that presents
    // depends on the stdin given: at EOF (docker run without `-i`) the prompt
    // never settles and the process exits having generated nothing; an open but
    // silent pipe (a CI step, a Gradle exec) hangs; a pipe carrying newlines
    // takes the first choice and generates the wrong artifact with exit 0.
    // Name every missing flag at once, so a caller fixes its invocation in one
    // pass rather than one flag per run.
    if (!process.stdin.isTTY) {
      const missing = [
        generator ? null : "--generator (-g)",
        language ? null : "--language (-l)",
        outDir ? null : "--out (-o)"
      ].filter((flag): flag is string => flag !== null);

      if (missing.length > 0) {
        this.error(
          `Cannot prompt for ${missing.join(
            ", "
          )} without a terminal. Pass every flag explicitly when running non-interactively.`,
          { exit: 2 }
        );
      }
    }

    if (!generator) {
      generator = (
        await inquirer.prompt<{
          Generator: string;
        }>({
          name: "Generator",
          // The label a user sees. Fixed rather than derived from `name`, and
          // its exact text is asserted in generate.spec.ts.
          message: "Generator:",
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
        await inquirer.prompt<{
          Language: string;
        }>({
          name: "Language",
          message: "Language:",
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
        await inquirer.prompt<{
          "Output destination": string;
        }>({
          name: "Output destination",
          message: "Output destination:",
          type: "input",
          default: "."
        })
      )["Output destination"];
    }

    const generatorTransformer = generators[generator].transformer;
    const formatTransformer = generators[generator].formats[language].formatter;
    const formatExtension = generators[generator].formats[language].extension;

    const transformedContract = generatorTransformer(parse(contractPath));
    const formattedContract = formatTransformer(transformedContract);

    const outputName = `${contractFilename}.${formatExtension}`;
    outputFile(outDir, outputName, formattedContract);

    this.log(`Generated ${resolveOutputPath(outDir, outputName)}`);
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
