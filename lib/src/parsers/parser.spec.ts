import { parse } from "./parser";

describe("parser", () => {
  test("parses all information", () => {
    const result = parse("./lib/src/test/examples/contract.ts", {
      baseUrl: "./",
      paths: {
        "@airtasker/spot": ["./lib/src/lib"]
      }
    });
    expect(result.api).not.toBeUndefined;
    expect(result.endpoints).toHaveLength(2);
    expect(result.types).toHaveLength(7);
  });
});
