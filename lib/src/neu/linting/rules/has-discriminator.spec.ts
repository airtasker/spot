import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { hasDiscriminator } from "./has-discriminator";

describe("has-discriminator linter rule", () => {
  test("returns no violations for contract containing object unions with a discriminator", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-discriminator/object-union-with-discriminator.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasDiscriminator(contract)).toHaveLength(0);
  });

  test("returns no violations for contract containing single type and null unions", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-discriminator/single-type-or-null-union.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasDiscriminator(contract)).toHaveLength(0);
  });

  test("returns no violations for contract containing string literal unions", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-discriminator/string-literal-union.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasDiscriminator(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing object unions with no discriminator", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-discriminator/object-union-with-no-discriminator.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(hasDiscriminator(contract)).toHaveLength(1);
  });

  test("returns violations for every component of a contract", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/has-discriminator/contract-with-union-violations-in-each-component.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = hasDiscriminator(contract);
    expect(result).toHaveLength(8);
    const messages = result.map(v => v.message);
    expect(messages).toContain(
      "Endpoint (Endpoint) request header (header) contains a union type with no discriminator: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) request path parameter (companyId) contains a union type with no discriminator: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) request query parameter (query) contains a union type with no discriminator: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) request body contains a union type with no discriminator: #/requestUnion"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (200) header (header) contains a union type with no discriminator: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (200) body contains a union type with no discriminator: #/successUnion"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (default) body contains a union type with no discriminator: #/errorUnion"
    );
  });
});
