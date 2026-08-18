import * as path from "path";
import { parse } from "./parser";

const CONTRACT_FIXTURE = path.join(
  __dirname,
  "../../test-fixtures/contract/api.ts"
);

const TYPE_ERROR_FIXTURE = path.join(
  __dirname,
  "__spec-examples__/contract-with-type-error.ts"
);

describe("parse", () => {
  test("resolves @airtasker/spot without an installed copy beside the contract", () => {
    // There is no node_modules/@airtasker/spot in this repository, so the
    // contract's own `import ... from "@airtasker/spot"` can only resolve
    // through the path mapping Spot configures for the contract project.
    const contract = parse(CONTRACT_FIXTURE);

    expect(contract.name).toBe("widget-api");
    expect(contract.endpoints.map(e => e.name).sort()).toEqual([
      "CreateWidget",
      "ListWidgets"
    ]);
  });

  test("rejects a contract whose project has a type error", () => {
    expect(() => parse(TYPE_ERROR_FIXTURE)).toThrow(
      /not assignable to type 'number'/
    );
  });
});
