import * as path from "path";
import { parseFilePath } from '../../parsers/parser';
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
        const api = await parseFilePath(
          EXAMPLE_PATH,
          {
            baseUrl: '.',
            paths: {
              "@airtasker/spotnext": ["./libnext/src/lib"]
            }
          }
        );
        expect(generateOpenApiV2(api, "json")).toMatchSnapshot("json");
        expect(generateOpenApiV2(api, "yaml")).toMatchSnapshot("yaml");
      });
});
