import { cleanse } from "../cleansers/cleanser";
import { parse } from "../parsers/parser";
import { hashContractDefinition } from "./hash";

describe("Hash", () => {
  describe("hashContractDefinition", () => {
    it("returns a new hash when the contract is updated", () => {
      const result = parse("./lib/src/test/examples/contract.ts");
      const contractDefinition = cleanse(result);

      const hash0 = hashContractDefinition(contractDefinition);

      contractDefinition.api.name = "test";

      const hash1 = hashContractDefinition(contractDefinition);

      expect(hash0).not.toEqual(hash1);
    });
  });
});
