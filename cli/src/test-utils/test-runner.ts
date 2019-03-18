import JsonSchemaValidator from "ajv";
import axios, { AxiosRequestConfig } from "axios";
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
import { DataType } from "../../../lib/src/models/types";
import { valueFromDataExpression } from "../../../lib/src/utilities/data-expression-utils";
import { asyncForEach } from "../common/utils";
import TestLogger from "./test-logger";

export async function runTest(
  definition: ContractDefinition,
  stateUrl: string,
  baseUrl: string,
  testFilter?: TestFilter
): Promise<boolean> {
  let allPassed = true;

  await asyncForEach(definition.endpoints, async endpoint => {
    await asyncForEach(endpoint.tests, async test => {
      if (testFilter) {
        if (
          testFilter.endpoint !== endpoint.name ||
          (testFilter.test && testFilter.test !== test.name)
        ) {
          TestLogger.warn(`test ${endpoint.name}:${test.name} skipped`);
          return;
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
        TestLogger.success(`Test ${endpoint.name}:${test.name} passed`);
      } else {
        TestLogger.error(`Test ${endpoint.name}:${test.name} failed`);
      }
      allPassed = allPassed && result;
    });
  });

  return allPassed;
}

async function executeTest(
  test: TestDefinition,
  stateUrl: string,
  baseUrl: string,
  endpoint: EndpointDefinition,
  correlatedResponse: DefaultResponseDefinition,
  typeStore: TypeNode[]
): Promise<boolean> {
  try {
    try {
      await executeStateSetup(test, stateUrl);
    } catch {
      return false;
    }

    const testResult = await executeRequestUnderTest(
      endpoint,
      test,
      baseUrl,
      correlatedResponse,
      typeStore
    );

    await executeStateTeardown(stateUrl);

    return testResult;
  } catch {
    return false;
  }
}

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

async function executeRequestUnderTest(
  endpoint: EndpointDefinition,
  test: TestDefinition,
  baseUrl: string,
  correlatedResponse: DefaultResponseDefinition,
  typeStore: TypeNode[]
) {
  const config = generateAxiosConfig(endpoint, test, baseUrl);
  const response = await axios.request(config);
  const statusResult = verifyStatus(test, response);
  // TODO: check headers
  const bodyResult = correlatedResponse.body
    ? verifyBody(correlatedResponse.body.type, response.data, typeStore)
    : true;
  const testResult = statusResult && bodyResult;
  return testResult;
}

async function executeStateSetup(
  test: TestDefinition,
  stateUrl: string
): Promise<void> {
  await asyncForEach(test.states, async state => {
    TestLogger.log(`Performing state setup request: ${state.name}`);
    const data = {
      name: state.name,
      params: state.params.reduce<GenericParams>((acc, param) => {
        acc[param.name] = valueFromDataExpression(param.expression);
        return acc;
      }, {})
    };
    try {
      await axios.post(stateUrl, data, { params: { action: "setup" } });
      TestLogger.success(`State setup request (${state.name}) success`);
    } catch (error) {
      if (error.response) {
        TestLogger.error(
          `State change request (${state.name}) failed: received ${
            error.response.status
          } status`
        );
      } else if (error.request) {
        TestLogger.error(
          `State change request (${state.name}) failed: no response`
        );
      } else {
        TestLogger.error(
          `State change request (${state.name}) failed: ${error.message}`
        );
      }
      throw error;
    }
  });
}

async function executeStateTeardown(stateUrl: string): Promise<void> {
  try {
    TestLogger.log("Performing state teardown request");
    await axios.post(stateUrl, undefined, { params: { action: "teardown" } });
    TestLogger.success("State teardown request success");
  } catch (error) {
    if (error.response) {
      TestLogger.error(
        `State teardown request failed: received ${
          error.response.status
        } status`
      );
    } else if (error.request) {
      TestLogger.error(`State teardown request failed: no response`);
    } else {
      TestLogger.error(`State teardown request failed: ${error.message}`);
    }
    throw error;
  }
}

function verifyStatus(test: TestDefinition, response: any): boolean {
  if (test.response.status === response.status) {
    TestLogger.success("Status matched");
    return true;
  } else {
    TestLogger.error(
      `Expected status ${test.response.status}, got ${response.status}`
    );
    return false;
  }
}

function verifyBody(
  dataType: DataType,
  value: any,
  typeStore: TypeNode[]
): boolean {
  const jsv = new JsonSchemaValidator();
  const schema = {
    ...jsonTypeSchema(dataType),
    definitions: typeStore.reduce<{ [key: string]: JsonSchemaType }>(
      (defAcc, typeNode) => {
        return { [typeNode.name]: jsonTypeSchema(typeNode.type), ...defAcc };
      },
      {}
    )
  };
  const validateFn = jsv.compile(schema);
  const valid = validateFn(value);
  if (valid) {
    TestLogger.success("Body matched");
    return true;
  } else {
    TestLogger.error(
      `Body does not match: ${jsv.errorsText(validateFn.errors)}`
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
