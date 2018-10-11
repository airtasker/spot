import * as fs from "fs-extra";
import * as path from "path";
import { parse } from "./parser";

const TEST_CASES_DIR = path.join(__dirname, "..", "testcases");

describe("Test cases", () => {
  for (const testCaseName of fs.readdirSync(TEST_CASES_DIR)) {
    test(testCaseName, async () => {
      const source = await fs.readFile(
        path.join(TEST_CASES_DIR, testCaseName),
        "utf8"
      );
      let parsedApi = await parse(source);
      expect(parsedApi).toMatchSnapshot(testCaseName);
    });
  }
});
