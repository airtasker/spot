import { createProjectFromExistingSourceFile } from "../../../spec-helpers/helper";
import { parseContract } from "../../parsers/contract-parser";
import { generateOpenAPI3 } from "./openapi3";

describe("OpenAPI 3 generator", () => {
  test("produces valid code", () => {
    const file = createProjectFromExistingSourceFile(
      `${__dirname}/__spec-examples__/contract.ts`
    ).file;

    const { contract } = parseContract(file).unwrapOrThrow();
    const result = generateOpenAPI3(contract);

    expect(JSON.stringify(result, null, 2)).toMatchSnapshot();
  });
});
