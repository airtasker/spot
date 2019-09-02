import { createExistingSourceFile } from "../../spec-helpers/helper";
import { parseContract } from "./contract-parser";

describe("contract parser", () => {
  test("parses file containing @api decorated class", () => {
    const file = createExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/contract.ts`
    );

    const { contract, lociTable } = parseContract(file);

    expect(contract.name).toEqual("contract");
    expect(contract.description).toEqual("contract description");
    expect(contract.security).toStrictEqual(
      expect.objectContaining({ name: "security-header" })
    );
    expect(contract.endpoints).toHaveLength(2);
    expect(contract.endpoints).toContainEqual(
      expect.objectContaining({ name: "GetEndpoint" })
    );
    expect(contract.endpoints).toContainEqual(
      expect.objectContaining({ name: "PostEndpoint" })
    );
    expect(contract.types).toHaveLength(3);
    expect(contract.types).toContainEqual(
      expect.objectContaining({ name: "DefaultBody" })
    );
    expect(contract.types).toContainEqual(
      expect.objectContaining({ name: "RequestBody" })
    );
    expect(contract.types).toContainEqual(
      expect.objectContaining({ name: "SuccessBody" })
    );
  });

  test("parses minimal file containing @api decorated class", () => {
    const file = createExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/minimal-contract.ts`
    );

    const { contract, lociTable } = parseContract(file);

    expect(contract).toStrictEqual({
      description: undefined,
      endpoints: [],
      name: "contract",
      security: undefined,
      types: []
    });
  });

  test("fails to parse file that does not contain @api decorated class", () => {
    const file = createExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/not-contract.ts`
    );

    expect(() => parseContract(file)).toThrowError(
      "expected a decorator @api to be used once, found 0 usages"
    );
  });
});
