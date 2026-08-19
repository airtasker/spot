import JsonSchemaValidator from "ajv";
import { parseContract } from "../../parsers/contract-parser";
import { createProjectFromExistingSourceFile } from "../../spec-helpers/helper";
import { generateJsonSchema } from "./json-schema";

describe("JSON Schema generator", () => {
  /**
   * Checks a generated schema against the draft-07 meta-schema.
   *
   * Two assertions, because they catch different things. `validateSchema` reads
   * the schema's shape and accepts a dangling `$ref`, an unknown keyword and an
   * unknown format. `compile` is what resolves references — and this generator
   * emits them — and under `strict` it also rejects a keyword or format it does
   * not know. A fresh instance per call, since compiling registers the schema.
   */
  const assertValidJsonSchema = (schema: unknown): void => {
    const validator = new JsonSchemaValidator({ strict: true });
    expect(validator.validateSchema(schema as object)).toBe(true);
    expect(validator.errors ?? []).toEqual([]);
    expect(() => validator.compile(schema as object)).not.toThrow();
  };

  test("rejects a schema the generator should never emit", () => {
    // The call this replaced had no ruleset loaded, so it returned zero findings
    // for a valid schema and a broken one alike. This is the case that proves
    // the replacement can fail.
    expect(() =>
      assertValidJsonSchema({
        $schema: "http://json-schema.org/draft-07/schema#",
        $ref: "#/definitions/Absent",
        definitions: {}
      })
    ).toThrow();
  });

  test("rejects a keyword ajv does not know", () => {
    // Pins `strict`. Without it a misspelled keyword is ignored rather than
    // reported, and the schema compiles as though the constraint were there.
    expect(() =>
      assertValidJsonSchema({
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "number",
        minimun: 3
      })
    ).toThrow();
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
    assertValidJsonSchema(result);
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
    assertValidJsonSchema(result);
  });

  test("evaluates intersection type", async () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contract-with-intersection-types.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();
    const result = generateJsonSchema(contract);

    expect(result).toMatchSnapshot();
    assertValidJsonSchema(result);
  });
});
