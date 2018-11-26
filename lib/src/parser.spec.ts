import * as fs from "fs-extra";
import * as path from "path";
import { parsePath } from "./parsing/file-parser";

const EXAMPLES_DIR = path.join(__dirname, "..", "..", "examples", "src");

describe("Parser", () => {
  describe("produces the expected output for example API definitions", async () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        let parsedApi = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        expect(parsedApi).toMatchSnapshot();
      });
    }
  });
});
