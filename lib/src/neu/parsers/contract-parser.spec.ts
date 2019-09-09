import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { parseContract } from "./contract-parser";

describe("contract parser", () => {
  test("parses file containing @api decorated class", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/contract.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(contract.name).toEqual("contract");
    expect(contract.description).toEqual("contract description");
    expect(contract.config).toStrictEqual({
      paramSerializationStrategy: {
        query: {
          array: "comma"
        }
      }
    });
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
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/minimal-contract.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(contract).toStrictEqual({
      description: undefined,
      config: {
        paramSerializationStrategy: {
          query: {
            array: "ampersand"
          }
        }
      },
      endpoints: [],
      name: "contract",
      security: undefined,
      types: []
    });
  });

  test("fails to parse file that does not contain @api decorated class", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/not-contract.ts`
    ).file;

    expect(() => parseContract(file)).toThrowError(
      "expected a decorator @api to be used once, found 0 usages"
    );
  });
});
