import * as fs from "fs-extra";
import * as path from "path";
import { parsePath } from "../../parsing/file-parser";
import {
  generateEndpointHandlerSource,
  generateExpressServerSource
} from "./express-server";

const EXAMPLES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "examples",
  "src"
);

describe("TypeScript Express server generator", () => {
  describe("produces valid code", () => {
    for (const testCaseName of fs.readdirSync(EXAMPLES_DIR)) {
      if (!fs.lstatSync(path.join(EXAMPLES_DIR, testCaseName)).isDirectory()) {
        continue;
      }
      test(testCaseName, async () => {
        const api = await parsePath(
          path.join(EXAMPLES_DIR, testCaseName, `${testCaseName}-api.ts`)
        );
        const serverSource = generateExpressServerSource(api);
        expect(serverSource).toMatchSnapshot("server");
        for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
          const endpointSource = generateEndpointHandlerSource(
            api,
            endpointName,
            endpoint
          );
          expect(endpointSource).toMatchSnapshot(`endpoint:${endpointName}`);
        }
      });
    }
  });
});
