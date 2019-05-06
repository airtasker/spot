import JsonSchemaValidator from "ajv";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { stringify as qsStringify } from "qs";
import {
  JsonSchemaType,
  jsonTypeSchema
} from "../../../lib/src/generators/contract/json-schema";
import {
  ContractDefinition,
  DefaultResponseDefinition,
  EndpointDefinition,
  TestDefinition
} from "../../../lib/src/models/definitions";
import { TypeNode } from "../../../lib/src/models/nodes";
import { valueFromDataExpression } from "../../../lib/src/utilities/data-expression-utils";
import { TestLogger } from "./test-logger";
import { TestTimer } from "./test-timer";

/**
 * Run the contract test suite for a contract.
 *
 * @param definition contract definition
 * @param baseStateUrl base state change URL
 * @param baseUrl base URL
 * @param testFilter optional test filter
 */
export async function runTest(
  definition: ContractDefinition,
  baseStateUrl: string,
  baseUrl: string,
  testFilter?: TestFilter
): Promise<boolean> {
  const testSuiteStartTime = TestTimer.startTime();

  let allPassed = true;

  for (const endpoint of definition.endpoints) {
    for (const test of endpoint.tests) {
      if (testFilter) {
        if (
          testFilter.endpoint !== endpoint.name ||
          (testFilter.test && testFilter.test !== test.name)
        ) {
          TestLogger.warn(`Test ${endpoint.name}:${test.name} skipped`);
          continue;
        }
      }
      const testStartTime = TestTimer.startTime();

      TestLogger.log(`Testing ${endpoint.name}:${test.name}`);
      const correlatedResponse = findCorrelatedResponse(endpoint, test);
      const result = await executeTest(
        test,
        baseStateUrl,
        baseUrl,
        endpoint,
        correlatedResponse,
        definition.types
      );

      if (result) {
        TestLogger.success(
          `Test ${endpoint.name}:${test.name} passed (${TestTimer.formattedDiff(
            testStartTime
          )})`,
          { indent: 1 }
        );
      } else {
        TestLogger.error(
          `Test ${endpoint.name}:${test.name} failed (${TestTimer.formattedDiff(
            testStartTime
          )})`,
          { indent: 1 }
        );
      }
      allPassed = allPassed && result;
    }
  }

  TestLogger.log(
    `Total time: ${TestTimer.formattedDiff(testSuiteStartTime)}\n`
  );

  return allPassed;
}

/**
 * Run a particular contract test.
 *
 * @param test test definition
 * @param baseStateUrl base state change URL
 * @param baseUrl base URL
 * @param endpoint endpoint definition
 * @param correlatedResponse expected test response
 * @param typeStore reference type definitions
 */
async function executeTest(
  test: TestDefinition,
  baseStateUrl: string,
  baseUrl: string,
  endpoint: EndpointDefinition,
  correlatedResponse: DefaultResponseDefinition,
  typeStore: TypeNode[]
): Promise<boolean> {
  if (
    (await executeStateInitialization(baseStateUrl)) &&
    (await executeStateSetup(test, baseStateUrl))
  ) {
    const testResult = await executeRequestUnderTest(
      endpoint,
      test,
      baseUrl,
      correlatedResponse,
      typeStore
    );
    const stateTearDownResult = await executeStateTeardown(baseStateUrl);
    return testResult && stateTearDownResult;
  } else {
    await executeStateTeardown(baseStateUrl);
    return false;
  }
}

/**
 * Find the the response that matches the response status for a particular test.
 * If no exact response status is found, the default response is used. Otherwise
 * an error it thrown.
 *
 * @param endpoint endpoint definition
 * @param test test definition
 */
function findCorrelatedResponse(
  endpoint: EndpointDefinition,
  test: TestDefinition
): DefaultResponseDefinition {
  const correlatedResponse =
    endpoint.responses.find(
      response => response.status === test.response.status
    ) || endpoint.defaultResponse;
  if (!correlatedResponse) {
    throw new Error(
      `a response with status ${
        test.response.status
      } was not found and a default response has not been defined`
    );
  }
  return correlatedResponse;
}

/**
 * Generate the axios configuration necessary to execute the request
 * under test. All responses statuses are considered valid with this
 * configuration.
 *
 * @param endpoint endpoint definition
 * @param test test definition
 * @param baseUrl base URL
 */
function generateAxiosConfig(
  endpoint: EndpointDefinition,
  test: TestDefinition,
  baseUrl: string
): AxiosRequestConfig {
  const urlPath = endpoint.path
    .split("/")
    .map(value => {
      if (value.startsWith(":")) {
        if (test.request) {
          const pathParam = test.request.pathParams.find(pathParam => {
            return pathParam.name === value.substring(1);
          });
          if (pathParam) {
            return valueFromDataExpression(pathParam.expression);
          } else {
            throw new Error(
              `Unable to find path param for ${value} in ${endpoint.path}`
            );
          }
        } else {
          throw new Error(
            `Unable to find path param for ${value} in ${endpoint.path}`
          );
        }
      } else {
        return value;
      }
    })
    .join("/");

  const config: AxiosRequestConfig = {
    baseURL: baseUrl,
    url: urlPath,
    method: endpoint.method,
    validateStatus: () => true // never invalidate the status
  };

  if (test.request) {
    config.headers = test.request.headers.reduce<AxiosHeaders>(
      (acc, header) => {
        acc[header.name] = valueFromDataExpression(header.expression);
        return acc;
      },
      {}
    );

    config.params = test.request.queryParams.reduce<GenericParams>(
      (acc, param) => {
        acc[param.name] = valueFromDataExpression(param.expression);
        return acc;
      },
      {}
    );

    config.paramsSerializer = params => {
      return qsStringify(params);
    };

    if (test.request.body) {
      config.data = valueFromDataExpression(test.request.body);
    }
  }
  return config;
}

/**
 * Executes the request under test.
 *
 * @param endpoint endpoint definition
 * @param test test definition
 * @param baseUrl base URL
 * @param correlatedResponse expected test response
 * @param typeStore reference type definitions
 */
async function executeRequestUnderTest(
  endpoint: EndpointDefinition,
  test: TestDefinition,
  baseUrl: string,
  correlatedResponse: DefaultResponseDefinition,
  typeStore: TypeNode[]
) {
  const testStartTime = process.hrtime();

  const config = generateAxiosConfig(endpoint, test, baseUrl);
  TestLogger.log(
    `Performing request under test: ${config.method} ${config.url}`,
    { indent: 1 }
  );
  TestLogger.log(
    `Request complete (${TestTimer.formattedDiff(testStartTime)})`,
    { indent: 2 }
  );
  const response = await axios.request(config);
  const statusResult = verifyStatus(test, response);
  // TODO: check headers
  const bodyResult = verifyBody(correlatedResponse, response, typeStore);

  return statusResult && bodyResult;
}

/**
 * Execute the state initialization request.
 *
 * @param baseStateUrl base state change URL
 */
async function executeStateInitialization(
  baseStateUrl: string
): Promise<boolean> {
  const testInitStartTime = process.hrtime();

  try {
    TestLogger.log("Performing state initialization request", { indent: 1 });
    await axios.post(`${baseStateUrl}/initialize`);
    TestLogger.success(
      `State initialization request success (${TestTimer.formattedDiff(
        testInitStartTime
      )})`,
      { indent: 2 }
    );
    return true;
  } catch (error) {
    if (error.response) {
      TestLogger.error(
        `State initialization request failed: received ${
          error.response.status
        } status (${TestTimer.formattedDiff(
          testInitStartTime
        )})\nReceived:\n${JSON.stringify(error.response.data, undefined, 2)}`,
        { indent: 2 }
      );
    } else if (error.request) {
      TestLogger.error(
        `State initialization request failed: no response (${TestTimer.formattedDiff(
          testInitStartTime
        )})`,
        { indent: 2 }
      );
    } else {
      TestLogger.error(
        `State initialization request failed: ${
          error.message
        } (${TestTimer.formattedDiff(testInitStartTime)})`,
        { indent: 2 }
      );
    }
    return false;
  }
}

/**
 * Execute state setup requests defined for a test.
 *
 * @param test test definition
 * @param baseStateUrl base state change URL
 */
async function executeStateSetup(
  test: TestDefinition,
  baseStateUrl: string
): Promise<boolean> {
  for (const state of test.states) {
    const testSetupStartTime = process.hrtime();

    TestLogger.log(`Performing state setup request: ${state.name}`, {
      indent: 1
    });
    const data = {
      name: state.name,
      params: state.params.reduce<GenericParams>((acc, param) => {
        acc[param.name] = valueFromDataExpression(param.expression);
        return acc;
      }, {})
    };
    try {
      await axios.post(`${baseStateUrl}/setup`, data);
      TestLogger.success(
        `State setup request (${state.name}) success (${TestTimer.formattedDiff(
          testSetupStartTime
        )})`,
        { indent: 2 }
      );
    } catch (error) {
      if (error.response) {
        TestLogger.error(
          `State change request (${state.name}) failed: received ${
            error.response.status
          } status (${TestTimer.formattedDiff(
            testSetupStartTime
          )})\nReceived:\n${JSON.stringify(error.response.data, undefined, 2)}`,
          { indent: 2 }
        );
      } else if (error.request) {
        TestLogger.error(
          `State change request (${
            state.name
          }) failed: no response (${TestTimer.formattedDiff(
            testSetupStartTime
          )})`,
          { indent: 2 }
        );
      } else {
        TestLogger.error(
          `State change request (${state.name}) failed: ${
            error.message
          } (${TestTimer.formattedDiff(testSetupStartTime)})`,
          { indent: 2 }
        );
      }
      return false;
    }
  }
  return true;
}

/**
 * Execute the state teardown request.
 *
 * @param baseStateUrl base state change URL
 */
async function executeStateTeardown(baseStateUrl: string): Promise<boolean> {
  const testTeardownStartTime = process.hrtime();

  try {
    TestLogger.log("Performing state teardown request", { indent: 1 });
    await axios.post(`${baseStateUrl}/teardown`);
    TestLogger.success(
      `State teardown request success (${TestTimer.formattedDiff(
        testTeardownStartTime
      )})`,
      { indent: 2 }
    );
    return true;
  } catch (error) {
    if (error.response) {
      TestLogger.error(
        `State teardown request failed: received ${
          error.response.status
        } status (${TestTimer.formattedDiff(
          testTeardownStartTime
        )})\nReceived:\n${JSON.stringify(error.response.data, undefined, 2)}`,
        { indent: 2 }
      );
    } else if (error.request) {
      TestLogger.error(
        `State teardown request failed: no response (${TestTimer.formattedDiff(
          testTeardownStartTime
        )})`,
        { indent: 2 }
      );
    } else {
      TestLogger.error(
        `State teardown request failed: ${
          error.message
        } (${TestTimer.formattedDiff(testTeardownStartTime)})`,
        { indent: 2 }
      );
    }
    return false;
  }
}

/**
 * Check if an axios response status matches the expected status of a test.
 *
 * @param test test definition
 * @param response axios response
 */
function verifyStatus(
  test: TestDefinition,
  response: AxiosResponse<any>
): boolean {
  if (test.response.status === response.status) {
    TestLogger.success("Status matched", { indent: 2 });
    return true;
  } else {
    TestLogger.error(
      `Expected status ${test.response.status}, got ${response.status}`,
      { indent: 2 }
    );
    return false;
  }
}

/**
 * Check if an exios response body matches the expected body of an expected response definition.
 *
 * @param expectedResponse expected response
 * @param response axios response
 * @param typeStore reference type definitions
 */
function verifyBody(
  expectedResponse: DefaultResponseDefinition,
  response: AxiosResponse<any>,
  typeStore: TypeNode[]
): boolean {
  if (!expectedResponse.body) {
    return true;
  }

  const jsv = new JsonSchemaValidator();
  const schema = {
    ...jsonTypeSchema(expectedResponse.body.type),
    definitions: typeStore.reduce<{ [key: string]: JsonSchemaType }>(
      (defAcc, typeNode) => {
        return { [typeNode.name]: jsonTypeSchema(typeNode.type), ...defAcc };
      },
      {}
    )
  };
  const validateFn = jsv.compile(schema);
  const valid = validateFn(response.data);
  if (valid) {
    TestLogger.success("Body matched", { indent: 2 });
    return true;
  } else {
    TestLogger.error(
      `Body does not match: ${jsv.errorsText(
        validateFn.errors
      )}\nReceived:\n${JSON.stringify(response.data, undefined, 2)}`,
      { indent: 2 }
    );
    return false;
  }
}

interface AxiosHeaders {
  [key: string]: string;
}

interface GenericParams {
  [key: string]: any;
}

export interface TestFilter {
  endpoint: string;
  test?: string;
}
