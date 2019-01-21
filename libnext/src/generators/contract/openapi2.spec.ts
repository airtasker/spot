import * as path from "path";
import { cleanse } from "../../cleansers/cleanser";
import { parseFilePath } from "../../parsers/parser";
import { generateOpenApiV2 } from "./openapi2";

const EXAMPLE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "test",
  "examples",
  "contract.ts"
);

describe("OpenAPI 2 generator", () => {
  test("produces valid code", async () => {
    const contractNode = await parseFilePath(EXAMPLE_PATH, {
      baseUrl: ".",
      paths: {
        "@airtasker/spotnext": ["./libnext/src/lib"]
      }
    });
    const contractDefinition = cleanse(contractNode);
    expect(generateOpenApiV2(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateOpenApiV2(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });
});
