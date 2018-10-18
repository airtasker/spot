import * as fs from "fs-extra";
import * as path from "path";
import { parsePath } from "../../parser";
import { generateAxiosClientSource } from "./axios-client";

const EXAMPLES_DIR = path.join(__dirname, "..", "..", "..", "examples");

describe("TypeScript axios client generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, "api.ts")
        );
        const source = generateAxiosClientSource(api);
        expect(source).toMatchSnapshot();
      });
    }
  });
});
