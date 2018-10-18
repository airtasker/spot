import * as fs from "fs-extra";
import * as path from "path";
import { parsePath } from "./parser";

const EXAMPLES_DIR = path.join(__dirname, "..", "examples");

describe("Parser", () => {
  describe("produces the expected output for example API definitions", async () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      test(testCaseName, async () => {
        let parsedApi = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        expect(parsedApi).toMatchSnapshot();
      });
    }
  });
});
