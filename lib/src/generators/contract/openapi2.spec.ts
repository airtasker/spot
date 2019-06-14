import { cleanse } from "../../cleansers/cleanser";
import { parse } from "../../parsers/parser";
import { generateOpenApiV2 } from "./openapi2";

const EXAMPLE_PATH = __dirname + "/../../__examples__/contract.ts";

describe("OpenAPI 2 generator", () => {
  test("produces valid code", async () => {
    const contractNode = await parse(EXAMPLE_PATH);
    const contractDefinition = cleanse(contractNode);
    expect(generateOpenApiV2(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateOpenApiV2(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });
});
