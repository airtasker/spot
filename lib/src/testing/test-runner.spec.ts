import nock from "nock";
import { cleanse } from "../cleansers/cleanser";
import { ContractDefinition } from "../models/definitions";
import { parse } from "../parsers/parser";
import { verify } from "../verifiers/verifier";
import { TestRunner } from "./test-runner";

describe("test runner", () => {
  const testExamplesBasePath = "./lib/src/testing/__examples__";
  const baseStateUrl = "http://localhost:9988/state";
  const baseUrl = "http://localhost:9988";
  const testRunnerConfig = {
    printer: () => {
      // Don't print out messages.
    },
    baseStateUrl,
    baseUrl,
    debugMode: true
  };

  const testRunner = new TestRunner(testRunnerConfig);

  afterEach(() => {
    nock.cleanAll();
  });

  test("no provider states passes", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/no-provider-states.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/companies", { name: "My Company", private: true })
      .reply(
        201,
        { name: "My Company" },
        { Location: `${baseUrl}/companies/abc` }
      )
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("single provider state", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company",
        employeeCount: 15
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("multiple provider states", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/multiple-provider-states.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc/users/def")
      .reply(200, {
        firstName: "John",
        lastName: "Snow",
        email: "johnsnow@spot.com"
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/setup", {
        name: "a user exists",
        params: { id: "def", companyId: "abc" }
      })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("multiple tests", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/multiple-tests.ts`
    );

    const scopeA = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/companies", { name: "My Company", private: true })
      .reply(
        201,
        { name: "My Company" },
        { Location: `${baseUrl}/companies/abc` }
      )
      .post("/state/teardown")
      .reply(200);

    const scopeB = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/companies", { name: 5 })
      .reply(400, { message: "error" })
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scopeA.isDone()).toBe(true);
    expect(scopeB.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("default response", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/default-response.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/companies", { private: true })
      .reply(400, { error: "Some Error" })
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("draft endpoint", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/draft-endpoint.ts`
    );

    const scopeDraft = nock(baseUrl)
      .post("/companies", { private: true })
      .reply(200);

    const scopeNotDraft = nock(baseUrl)
      .get("/companies")
      .reply(200, { name: "test" });

    const initializeScope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200);

    const tearDownScope = nock(baseUrl)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(initializeScope.isDone()).toBe(true);
    expect(tearDownScope.isDone()).toBe(true);
    expect(scopeDraft.isDone()).toBe(false);
    expect(scopeNotDraft.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("test filtering", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/multiple-tests.ts`
    );

    const scopeA = nock(baseUrl)
      .post("/companies", { name: "My Company", private: true })
      .reply(
        201,
        { name: "My Company" },
        { Location: `${baseUrl}/companies/abc` }
      );

    const scopeB = nock(baseUrl)
      .post("/companies", { name: 5 })
      .reply(400, { message: "error" });

    const initializeScope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200);

    const tearDownScope = nock(baseUrl)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract, {
      testFilter: { endpoint: "CreateCompany", test: "badRequestTest" }
    });

    expect(scopeA.isDone()).toBe(false);
    expect(scopeB.isDone()).toBe(true);
    expect(initializeScope.isDone()).toBe(true);
    expect(tearDownScope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("provider state initialization fail", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const initializeScope = nock(baseUrl)
      .post("/state/initialize")
      .reply(500);

    const setupScope = nock(baseUrl)
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200);

    const tearDownScope = nock(baseUrl)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(initializeScope.isDone()).toBe(true);
    expect(tearDownScope.isDone()).toBe(true);
    expect(setupScope.isDone()).toBe(false);
    expect(result).toBe(false);
  });

  test("provider state setup fail", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(400)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test("provider state teardown fail", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company",
        employeeCount: 15
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(400);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test("response status mismatch", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(204, {
        name: "My Company",
        employeeCount: 15
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test.skip("response header mismatch", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/no-provider-states.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .post("/companies", { name: "My Company", private: true })
      .reply(
        201,
        { name: "My Company" },
        { NotLocation: `${baseUrl}/companies/abc` }
      )
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test("response body mismatch - missing attribute", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company"
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test("response body mismatch - attribute type mismatch", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company",
        employeeCount: "15"
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(false);
  });

  test("response body mismatch - extra attribute", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/single-provider-state.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies/abc")
      .reply(200, {
        name: "My Company",
        employeeCount: 15,
        extra: true
      })
      .post("/state/setup", { name: "a company exists", params: { id: "abc" } })
      .reply(200)
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });

  test("request serializes query string objects using the deepObject strategy", async () => {
    const contract = parseAndCleanse(
      `${testExamplesBasePath}/object-query-param.ts`
    );

    const scope = nock(baseUrl)
      .post("/state/initialize")
      .reply(200)
      .get("/companies?profile%5Bname%5D=testname")
      .reply(200, [
        {
          name: "testname",
          employeeCount: 15
        }
      ])
      .post("/state/teardown")
      .reply(200);

    const result = await testRunner.test(contract);
    expect(scope.isDone()).toBe(true);
    expect(result).toBe(true);
  });
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
