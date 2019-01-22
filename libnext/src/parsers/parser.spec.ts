import { parse } from "./parser";

describe("parser", () => {
  test("parses all information", () => {
    const result = parse("./libnext/src/test/examples/contract.ts");
    expect(result.api).not.toBeUndefined;
    expect(result.endpoints).toHaveLength(2);
    expect(result.types).toHaveLength(7);
  });
});
