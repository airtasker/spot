import * as fs from "fs-extra";
import * as path from "path";
import { parse } from "./parser";

const TEST_CASES_DIR = path.join(__dirname, "..", "testcases");

describe("Test cases", () => {
  for (const testCaseName of fs.readdirSync(TEST_CASES_DIR)) {
    test(testCaseName, async () => {
      let parsedApi = await parse(path.join(TEST_CASES_DIR, testCaseName));
      expect(parsedApi).toMatchSnapshot(testCaseName);
    });
  }
});
