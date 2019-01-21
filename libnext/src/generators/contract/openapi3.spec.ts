import path from "path";
import { cleanse } from "../../cleansers/cleanser";
import { parseFilePath } from "../../parsers/parser";
import { generateOpenApiV3 } from "./openapi3";

const EXAMPLE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "test",
  "examples",
  "contract.ts"
);

describe("OpenAPI 3 generator", () => {
  test("produces valid code", async () => {
    const contractNode = await parseFilePath(EXAMPLE_PATH, {
      baseUrl: ".",
      paths: {
        "@airtasker/spotnext": ["./libnext/src/lib"]
      }
    });
    const contractDefinition = cleanse(contractNode);
    expect(generateOpenApiV3(contractDefinition, "json")).toMatchSnapshot(
      "json"
    );
    expect(generateOpenApiV3(contractDefinition, "yaml")).toMatchSnapshot(
      "yaml"
    );
  });
});
