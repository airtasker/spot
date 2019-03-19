import JsonSchemaValidator from "ajv";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
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

/**
 * Run the contract test suite for a contract.
 *
 * @param definition contract definition
 * @param stateUrl state change URL
 * @param baseUrl base URL
 * @param testFilter optional test filter
 */
export async function runTest(
  definition: ContractDefinition,
  stateUrl: string,
  baseUrl: string,
  testFilter?: TestFilter
): Promise<boolean> {
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
      TestLogger.log(`Testing ${endpoint.name}:${test.name}`);
      const correlatedResponse = findCorrelatedResponse(endpoint, test);
      const result = await executeTest(
        test,
        stateUrl,
        baseUrl,
        endpoint,
        correlatedResponse,
        definition.types
      );
      if (result) {
        TestLogger.success(`\tTest ${endpoint.name}:${test.name} passed`);
      } else {
        TestLogger.error(`\tTest ${endpoint.name}:${test.name} failed`);
      }
      allPassed = allPassed && result;
    }
  }

  return allPassed;
}

/**
 * Run a particular contract test.
 *
 * @param test test definition
 * @param stateUrl state change URL
 * @param baseUrl base URL
 * @param endpoint endpoint definition
 * @param correlatedResponse expected test response
 * @param typeStore reference type definitions
 */
async function executeTest(
  test: TestDefinition,
  stateUrl: string,
  baseUrl: string,
  endpoint: EndpointDefinition,
  correlatedResponse: DefaultResponseDefinition,
  typeStore: TypeNode[]
): Promise<boolean> {
  if (await executeStateSetup(test, stateUrl)) {
    const testResult = await executeRequestUnderTest(
      endpoint,
      test,
      baseUrl,
      correlatedResponse,
      typeStore
    );
    const stateTearDownResult = await executeStateTeardown(stateUrl);
    return testResult && stateTearDownResult;
  } else {
    await executeStateTeardown(stateUrl);
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
  const config = generateAxiosConfig(endpoint, test, baseUrl);
  TestLogger.mute(
    `\tPerforming request under test: ${config.method} ${config.url}`
  );
  const response = await axios.request(config);
  const statusResult = verifyStatus(test, response);
  // TODO: check headers
  const bodyResult = verifyBody(correlatedResponse, response, typeStore);

  return statusResult && bodyResult;
}

/**
 * Execute state setup requests defined for a test.
 *
 * @param test test definition
 * @param stateUrl state change URL
 */
async function executeStateSetup(
  test: TestDefinition,
  stateUrl: string
): Promise<boolean> {
  for (const state of test.states) {
    TestLogger.mute(`\tPerforming state setup request: ${state.name}`);
    const data = {
      name: state.name,
      params: state.params.reduce<GenericParams>((acc, param) => {
        acc[param.name] = valueFromDataExpression(param.expression);
        return acc;
      }, {})
    };
    try {
      await axios.post(stateUrl, data, { params: { action: "setup" } });
      TestLogger.success(`\t\tState setup request (${state.name}) success`);
    } catch (error) {
      if (error.response) {
        TestLogger.error(
          `\t\tState change request (${state.name}) failed: received ${
            error.response.status
          } status`
        );
      } else if (error.request) {
        TestLogger.error(
          `\t\tState change request (${state.name}) failed: no response`
        );
      } else {
        TestLogger.error(
          `\t\tState change request (${state.name}) failed: ${error.message}`
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
 * @param stateUrl state change URL
 */
async function executeStateTeardown(stateUrl: string): Promise<boolean> {
  try {
    TestLogger.mute("\tPerforming state teardown request");
    await axios.post(stateUrl, undefined, { params: { action: "teardown" } });
    TestLogger.success("\t\tState teardown request success");
    return true;
  } catch (error) {
    if (error.response) {
      TestLogger.error(
        `\t\tState teardown request failed: received ${
          error.response.status
        } status`
      );
    } else if (error.request) {
      TestLogger.error(`\t\tState teardown request failed: no response`);
    } else {
      TestLogger.error(`\t\tState teardown request failed: ${error.message}`);
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
    TestLogger.success("\t\tStatus matched");
    return true;
  } else {
    TestLogger.error(
      `\t\tExpected status ${test.response.status}, got ${response.status}`
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
    TestLogger.success("\t\tBody matched");
    return true;
  } else {
    TestLogger.error(
      `\t\tBody does not match: ${jsv.errorsText(validateFn.errors)}`
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
