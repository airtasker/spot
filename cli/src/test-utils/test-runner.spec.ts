import { cleanse } from "../../../lib/src/cleansers/cleanser";
import { ContractDefinition } from "../../../lib/src/models/definitions";
import { parse } from "../../../lib/src/parsers/parser";
import { runTest } from "./test-runner";

describe("test runner", () => {
  const stateUrl = "localhost:9988/state";
  const baseUrl = "localhost:9988";

  test("passes for a compliant server", async () => {
    const contract = parseAndCleanse(
      "./cli/src/test-utils/test-runner-examples/contract.ts"
    );
    const result = await runTest(contract, stateUrl, baseUrl);
    expect(result).toEqual(false);
  });
});

function parseAndCleanse(path: string): ContractDefinition {
  return cleanse(parse(path));
}
