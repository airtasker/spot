import { cleanse } from "../../cleansers/cleanser";
import { parse } from "../../parsers/parser";
import { generateOpenApiV3 } from "./openapi3";

const EXAMPLE_PATH = __dirname + "/../../__examples__/contract.ts";

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
});
