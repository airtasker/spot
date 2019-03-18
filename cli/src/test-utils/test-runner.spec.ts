import nock from "nock";
import { cleanse } from "../../../lib/src/cleansers/cleanser";
import { ContractDefinition } from "../../../lib/src/models/definitions";
import { parse } from "../../../lib/src/parsers/parser";
import { verify } from "../../../lib/src/verifiers/verifier";
import { runTest } from "./test-runner";

describe("test runner", () => {
  const stateUrl = "http://localhost:9988/state";
  const baseUrl = "http://localhost:9988";

  afterEach(() => {
    nock.cleanAll();
  });

  test("no provider states passes", async () => {
    const contract = parseAndCleanse(
      "./cli/src/test-utils/test-runner-examples/no-provider-states.ts"
    );

    const scope = nock(baseUrl)
      .post("/companies/abc/users")
      .reply(201, {
        firstName: "John",
        lastName: "Snow",
        email: "johnsnow@spot.com"
      })
      .post("/state")
      .query({ action: "teardown" })
      .reply(200);

    const result = await runTest(contract, stateUrl, baseUrl);
    expect(scope.isDone()).toEqual(true);
    expect(result).toEqual(true);
  });

  test("single provider state", async () => {
    const contract = parseAndCleanse(
      "./cli/src/test-utils/test-runner-examples/single-provider-state.ts"
    );

    const scope = nock(baseUrl)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company",
        employeeCount: 15
      })
      .post("/state", { name: "a company exists", params: { id: "abc" } })
      .query({ action: "setup" })
      .reply(200)
      .post("/state")
      .query({ action: "teardown" })
      .reply(200);

    const result = await runTest(contract, stateUrl, baseUrl);
    expect(scope.isDone()).toEqual(true);
    expect(result).toEqual(true);
  });

  test("multiple provider states", async () => {
    const contract = parseAndCleanse(
      "./cli/src/test-utils/test-runner-examples/multiple-provider-states.ts"
    );

    const scope = nock(baseUrl)
      .get("/companies/abc/users/def")
      .reply(200, {
        firstName: "John",
        lastName: "Snow",
        email: "johnsnow@spot.com"
      })
      .post("/state", { name: "a company exists", params: { id: "abc" } })
      .query({ action: "setup" })
      .reply(200)
      .post("/state", {
        name: "a user exists",
        params: { id: "def", companyId: "abc" }
      })
      .query({ action: "setup" })
      .reply(200)
      .post("/state")
      .query({ action: "teardown" })
      .reply(200);

    const result = await runTest(contract, stateUrl, baseUrl);
    expect(scope.isDone()).toEqual(true);
    expect(result).toEqual(true);
  });

  test.skip("state setup fail", async () => {});
  test.skip("state teardown fail", async () => {});
  test.skip("response status mismatch", async () => {});
  test.skip("response header mismatch", async () => {});
  test.skip("response body mismatch", async () => {});
});

function parseAndCleanse(path: string): ContractDefinition {
  const parsedContract = parse(path);
  const contractErrors = verify(parsedContract);
  if (contractErrors.length > 0) {
    throw new Error(
      contractErrors
        .map(error => `${error.location}#${error.line}: ${error.message}`)
        .join("\n")
    );
  }
  return cleanse(parsedContract);
}
