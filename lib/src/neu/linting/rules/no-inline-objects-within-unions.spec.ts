import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { noInlineObjectsWithinUnions } from "./no-inline-objects-within-unions";

describe("no-inline-objects-within-unions linter rule", () => {
  test("returns no violations for contract containing only referenced objects in unions", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-inline-objects-within-unions/referenced-objects-in-union.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noInlineObjectsWithinUnions(contract)).toHaveLength(0);
  });

  test("returns no violations for contract containing single inline object and null union", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-inline-objects-within-unions/inline-object-or-null-union.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noInlineObjectsWithinUnions(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing inline objects in unions", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-inline-objects-within-unions/inline-objects-in-union.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noInlineObjectsWithinUnions(contract)).toHaveLength(1);
  });

  test("returns violations for every component of a contract", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-inline-objects-within-unions/contract-inline-object-union-violations-in-each-query-param-and-body-component.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = noInlineObjectsWithinUnions(contract);
    expect(result).toHaveLength(4);
    const messages = result.map(v => v.message);
    expect(messages).toContain(
      "Endpoint (Endpoint) request query parameter (query) contains a union type with an inlined object member: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) request body contains a union type with an inlined object member: #/field"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (200) body contains a union type with an inlined object member: #/field"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (default) body contains a union type with an inlined object member: #/field"
    );
  });
});
