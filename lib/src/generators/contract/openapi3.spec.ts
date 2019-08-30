import { cleanse } from "../../cleansers/cleanser";
import { parse } from "../../parsers/parser";
import { generateOpenApiV3 } from "./openapi3";

const EXAMPLE_PATH = "./lib/src/__examples__/contract.ts";

describe("OpenAPI 3 generator", () => {
  test("produces valid code", async () => {
    const contractNode = await parse(EXAMPLE_PATH);
    const contractDefinition = cleanse(contractNode);
    expect(generateOpenApiV3(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateOpenApiV3(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });

  test("produces valid code when parameter serialization strategy is specified", async () => {
    const contractNode = await parse(
      "./lib/src/__examples__/contract-with-config.ts"
    );
    const contractDefinition = cleanse(contractNode);
    expect(generateOpenApiV3(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateOpenApiV3(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });
});
