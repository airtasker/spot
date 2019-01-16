import * as path from "path";
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
    const api = await parseFilePath(EXAMPLE_PATH, {
      baseUrl: ".",
      paths: {
        "@airtasker/spotnext": ["./libnext/src/lib"]
      }
    });
    expect(generateOpenApiV3(api, "json")).toMatchSnapshot("json");
    expect(generateOpenApiV3(api, "yaml")).toMatchSnapshot("yaml");
  });
});
