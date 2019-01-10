import { parseFilePath } from "./parser";

describe("parser", () => {
  test("parses all information", () => {
    const result = parseFilePath("./libnext/src/test/examples/contract.ts", {
      baseUrl: "./",
      paths: {
        "@airtasker/spotnext": ["./libnext/src/lib"]
      }
    });
    expect(result.api).not.toBeUndefined;
    expect(result.endpoints).toHaveLength(2);
    expect(result.types).toHaveLength(7);
  });
});
