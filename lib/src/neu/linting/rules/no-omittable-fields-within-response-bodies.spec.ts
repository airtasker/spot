import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { noOmittableFieldsWithinResponseBodies } from "./no-omittable-fields-within-response-bodies";

describe("no-omittable-fields-within-response-bodies linter rule", () => {
  test("returns no violations for contract containing no omittable response body fields", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-omittable-fields-within-response-bodies/no-omittable-field-in-response-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    expect(noOmittableFieldsWithinResponseBodies(contract)).toHaveLength(0);
  });

  test("returns a violation for contract containing a omittable response body fields", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/no-omittable-fields-within-response-bodies/omittable-field-in-response-body.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();

    const result = noOmittableFieldsWithinResponseBodies(contract);
    expect(result).toHaveLength(2);
    const messages = result.map(v => v.message);
    expect(messages).toContain(
      "Endpoint (Endpoint) response (200) body contains an omittable field: #/field"
    );
    expect(messages).toContain(
      "Endpoint (Endpoint) response (default) body contains an omittable field: #/field"
    );
  });
});
