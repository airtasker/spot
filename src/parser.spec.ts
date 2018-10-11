import * as fs from "fs-extra";
import * as path from "path";
import { parse } from "./parser";

const EXAMPLES_DIR = path.join(__dirname, "..", "examples");

describe("Parser", () => {
  describe("produces the expected output for example API definitions", async () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      test(testCaseName, async () => {
        const source = await fs.readFile(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts"),
          "utf8"
        );
        let parsedApi = await parse(source);
        expect(parsedApi).toMatchSnapshot();
      });
    }
  });
});
