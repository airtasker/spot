import { ApiNode, ContractNode } from "../../models/nodes";
import { STRING } from "../../models/types";
import { fakeLocatable } from "../../spec-helpers/fake-locatable";
import { verifyUniqueTypeNames } from "./types";

describe("unique type names verifier", () => {
  test("valid for correct usage", () => {
    const contractNode: ContractNode = {
      api: fakeLocatable({} as ApiNode),
      endpoints: [],
      types: [
        {
          name: "TypeOne",
          type: STRING
        },
        {
          name: "TypeTwo",
          type: STRING
        }
      ]
    };
    expect(verifyUniqueTypeNames(contractNode)).toHaveLength(0);
  });

  test("invalid for duplicate names", () => {
    const contractNode: ContractNode = {
      api: fakeLocatable({} as ApiNode),
      endpoints: [],
      types: [
        {
          name: "TypeOne",
          type: STRING
        },
        {
          name: "TypeOne",
          type: STRING
        }
      ]
    };
    expect(verifyUniqueTypeNames(contractNode)).toMatchObject([
      {
        message: "types must have unique names: TypeOne"
      }
    ]);
  });
});
