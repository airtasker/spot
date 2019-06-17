import { parse } from "./parser";

describe("parser", () => {
  test("parses all information", () => {
    const result = parse("./lib/src/__examples__/contract.ts");
    expect(result.api).not.toBeUndefined();
    expect(result.endpoints).toHaveLength(2);
    expect(result.types).toHaveLength(7);
  });

  test("follows recursive imports and exports", () => {
    const result = parse(
      "./lib/src/__examples__/recursive-imports-and-exports/contract.ts"
    );
    expect(result.api).not.toBeUndefined();
    expect(result.endpoints).toHaveLength(4);
  });
});
