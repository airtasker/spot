import * as fs from "fs-extra";
import * as path from "path";
import { parseFilePath } from '../../parsers/parser';
import { generateOpenApiV3 } from "./openapi3";

const EXAMPLES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "examples",
  "src"
);

describe("OpenAPI 3 generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parseFilePath(
          path.join(EXAMPLES_DIR, testCaseName, `${testCaseName}-api.ts`),
          {
            baseUrl: '.',
            paths: {
              "@airtasker/spot": ["./libnext/src/lib"]
            }
          }
        );
        expect(generateOpenApiV3(api, "json")).toMatchSnapshot("json");
        expect(generateOpenApiV3(api, "yaml")).toMatchSnapshot("yaml");
      });
    }
  });
});
