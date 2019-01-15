import * as fs from "fs-extra";
import * as path from "path";
import { parseFilePath } from "../../parsers/parser";
import { generateOpenApiV2 } from "./openapi2";

const EXAMPLES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "examples",
  "src"
);

describe("OpenAPI 2 generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parseFilePath(
          path.join(EXAMPLES_DIR, testCaseName, `${testCaseName}-api.ts`)
        );
        expect(generateOpenApiV2(api, "json")).toMatchSnapshot("json");
        expect(generateOpenApiV2(api, "yaml")).toMatchSnapshot("yaml");
      });
    }
  });
});
