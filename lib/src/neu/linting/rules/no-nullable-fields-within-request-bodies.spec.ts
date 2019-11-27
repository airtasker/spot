import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { noNullableFieldsWithinRequestBodies } from "./no-nullable-fields-within-request-bodies";

describe("no-nullable-fields-within-request-bodies linter rule", () => {
  test("returns no violations for contract containing a nullable request body field", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-nullable-fields-within-request-bodies/non-nullable-field-in-request-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noNullableFieldsWithinRequestBodies(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing a nullable request body field", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-nullable-fields-within-request-bodies/nullable-field-in-request-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = noNullableFieldsWithinRequestBodies(contract);
    expect(result).toHaveLength(2);
    const messages = result.map(v => v.message);
    expect(messages).toContain(
      "Endpoint (Endpoint) request body contains a nullable field: #/"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) request body contains a nullable field: #/body"
    );
  });
});
