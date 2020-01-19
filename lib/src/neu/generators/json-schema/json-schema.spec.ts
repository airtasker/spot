import { isJSONSchemaDraft7, Spectral } from "@stoplight/spectral";
import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { generateJsonSchema } from "./json-schema";

describe("JSON Schema generator", () => {
  const spectral = new Spectral();

  beforeAll(async () => {
    spectral.registerFormat("json-schema-draft7", isJSONSchemaDraft7);
  });

  test("produces minimal json schema", async () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/minimal-contract.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();
    const result = generateJsonSchema(contract);

    expect(result.$schema).toEqual("http://json-schema.org/draft-07/schema#");
    expect(result.definitions).toEqual({});
    expect(result).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });

  test("produces definitions", async () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contract-with-reference-types.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();
    const result = generateJsonSchema(contract);

    expect(result.definitions).toHaveProperty("User");
    expect(result.definitions).toHaveProperty("Users");
    expect(result).toMatchSnapshot();
    const spectralResult = await spectral.run(result);
    expect(spectralResult).toHaveLength(0);
  });
});
