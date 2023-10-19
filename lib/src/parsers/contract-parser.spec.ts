import { ParserError } from "../errors";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
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
      types: [],
      version: undefined,
      oa3servers: []
    });
  });

  test("fails to parse file that does not contain @api decorated class", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/not-contract.ts`
    ).file;

    expect(() => parseContract(file)).toThrow(
      "expected a decorator @api to be used once, found 0 usages"
    );
  });

  test("fails to parse file containing @api decorated class with an empty api name", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/empty-api-name-contract.ts`
    ).file;

    const result = parseContract(file).unwrapErrOrThrow();

    expect(result).toBeInstanceOf(ParserError);
  });

  test("fails to parse file containing @api decorated class with an api name containing illegal characters", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/illegal-api-name-contract.ts`
    ).file;

    const result = parseContract(file).unwrapErrOrThrow();

    expect(result).toBeInstanceOf(ParserError);
  });

  test("fails to parse contract containing duplicate endpoint names", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contracts/duplicate-endpoint-name-contract.ts`
    ).file;

    const result = parseContract(file).unwrapErrOrThrow();

    expect(result).toBeInstanceOf(ParserError);
  });
});
