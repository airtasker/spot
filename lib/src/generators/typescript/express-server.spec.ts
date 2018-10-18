import * as fs from "fs-extra";
import * as path from "path";
import { parsePath } from "../../parser";
import { generateExpressServerSource } from "./express-server";

const EXAMPLES_DIR = path.join(__dirname, "..", "..", "..", "..", "examples");

describe("TypeScript Express server generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        const source = generateExpressServerSource(api);
        expect(source).toMatchSnapshot();
      });
    }
  });
});
