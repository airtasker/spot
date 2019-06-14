import JsonSchemaValidator from "ajv";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { stringify as qsStringify } from "qs";
import {
  JsonSchemaType,
  jsonTypeSchema
} from "../generators/contract/json-schema";
import {
  ContractDefinition,
  DefaultResponseDefinition,
  EndpointDefinition,
  TestDefinition
} from "../models/definitions";
import { TypeNode } from "../models/nodes";
import { valueFromDataExpression } from "../utilities/data-expression-utils";
import { TestConfig } from "./common";
import { TestLogger } from "./test-logger";
import { TestTimer } from "./test-timer";

export class TestRunner {
  private readonly config: TestRunnerConfig;
  private readonly logger: TestLogger;

  constructor(config: TestRunnerConfig) {
    this.config = config;
    this.logger = new TestLogger(config.printer, {
      debugMode: config.debugMode
    });
  }

  /**
   * Run the contract test suite for a contract.
   *
   * @param definition contract definition
   * @param config test configuration
   */
  async test(
    definition: ContractDefinition,
    config?: TestConfig
  ): Promise<boolean> {
    const testSuiteStartTime = TestTimer.startTime();

    let allPassed = true;

    for (const endpoint of definition.endpoints) {
      for (const test of endpoint.tests) {
        if (config && config.testFilter) {
          if (
            config.testFilter.endpoint !== endpoint.name ||
            (config.testFilter.test && config.testFilter.test !== test.name)
          ) {
            this.logger.warn(`Test ${endpoint.name}:${test.name} skipped`);
            continue;
          }
        }
        const testStartTime = TestTimer.startTime();

        this.logger.log(`Testing ${endpoint.name}:${test.name}`);
        const correlatedResponse = this.findCorrelatedResponse(endpoint, test);
        const result = await this.executeTest(
          test,
          endpoint,
          correlatedResponse,
          definition.types
        );

        if (result) {
          this.logger.success(
            `Test ${endpoint.name}:${
              test.name
            } passed (${TestTimer.formattedDiff(testStartTime)})`,
            { indent: 1 }
          );
        } else {
          this.logger.error(
            `Test ${endpoint.name}:${
              test.name
            } failed (${TestTimer.formattedDiff(testStartTime)})`,
            { indent: 1 }
          );
        }
        allPassed = allPassed && result;
      }
    }

    this.logger.log(
      `Total time: ${TestTimer.formattedDiff(testSuiteStartTime)}\n`
    );

    return allPassed;
  }

  /**
   * Run a particular contract test.
   *
   * @param test test definition
   * @param endpoint endpoint definition
   * @param correlatedResponse expected test response
   * @param typeStore reference type definitions
   */
  private async executeTest(
    test: TestDefinition,
    endpoint: EndpointDefinition,
    correlatedResponse: DefaultResponseDefinition,
    typeStore: TypeNode[]
  ): Promise<boolean> {
    if (
      (await this.executeStateInitialization()) &&
      (await this.executeStateSetup(test))
    ) {
      const testResult = await this.executeRequestUnderTest(
        endpoint,
        test,
        correlatedResponse,
        typeStore
      );
      const stateTearDownResult = await this.executeStateTeardown();
      return testResult && stateTearDownResult;
    } else {
      await this.executeStateTeardown();
      return false;
    }
  }

  /**
   * Find the the response that matches the response status for a particular test.
   * If no exact response status is found, the default response is used. Otherwise
   * an error is thrown.
   *
   * @param endpoint endpoint definition
   * @param test test definition
   */
  private findCorrelatedResponse(
    endpoint: EndpointDefinition,
    test: TestDefinition
  ): DefaultResponseDefinition {
    const correlatedResponse =
      endpoint.responses.find(
        response => response.status === test.response.status
      ) || endpoint.defaultResponse;
    if (!correlatedResponse) {
      throw new Error(
        `a response with status ${test.response.status} was not found and a default response has not been defined`
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
   */
  private generateAxiosConfig(
    endpoint: EndpointDefinition,
    test: TestDefinition
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
      baseURL: this.config.baseUrl,
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
   * @param correlatedResponse expected test response
   * @param typeStore reference type definitions
   */
  private async executeRequestUnderTest(
    endpoint: EndpointDefinition,
    test: TestDefinition,
    correlatedResponse: DefaultResponseDefinition,
    typeStore: TypeNode[]
  ) {
    const testStartTime = process.hrtime();

    const config = this.generateAxiosConfig(endpoint, test);
    this.logger.log(
      `Performing request under test: ${config.method} ${config.url}`,
      { indent: 1 }
    );
    const response = await axios.request(config);
    this.logger.log(
      `Request complete (${TestTimer.formattedDiff(testStartTime)})`,
      { indent: 2 }
    );
    this.logger.debug(
      `Received:\n===============\nStatus: ${
        response.status
      }\nHeaders: ${TestLogger.formatObject(
        response.headers
      )}\nBody: ${TestLogger.formatObject(response.data)}\n===============`,
      { indent: 2 }
    );
    const statusResult = this.verifyStatus(test, response);
    // TODO: check headers
    const bodyResult = this.verifyBody(correlatedResponse, response, typeStore);

    return statusResult && bodyResult;
  }

  /**
   * Execute the state initialization request.
   */
  private async executeStateInitialization(): Promise<boolean> {
    const testInitStartTime = process.hrtime();

    try {
      this.logger.log("Performing state initialization request", { indent: 1 });
      await axios.post(`${this.config.baseStateUrl}/initialize`);
      this.logger.success(
        `State initialization request success (${TestTimer.formattedDiff(
          testInitStartTime
        )})`,
        { indent: 2 }
      );
      return true;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `State initialization request failed: received ${
            error.response.status
          } status (${TestTimer.formattedDiff(
            testInitStartTime
          )})\nReceived:\n${TestLogger.formatObject(error.response.data)}`,
          { indent: 2 }
        );
      } else if (error.request) {
        this.logger.error(
          `State initialization request failed: no response (${TestTimer.formattedDiff(
            testInitStartTime
          )})`,
          { indent: 2 }
        );
      } else {
        this.logger.error(
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
   */
  private async executeStateSetup(test: TestDefinition): Promise<boolean> {
    for (const state of test.states) {
      const testSetupStartTime = process.hrtime();

      this.logger.log(`Performing state setup request: ${state.name}`, {
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
        await axios.post(`${this.config.baseStateUrl}/setup`, data);
        this.logger.success(
          `State setup request (${
            state.name
          }) success (${TestTimer.formattedDiff(testSetupStartTime)})`,
          { indent: 2 }
        );
      } catch (error) {
        if (error.response) {
          this.logger.error(
            `State change request (${state.name}) failed: received ${
              error.response.status
            } status (${TestTimer.formattedDiff(
              testSetupStartTime
            )})\nReceived:\n${TestLogger.formatObject(error.response.data)}`,
            { indent: 2 }
          );
        } else if (error.request) {
          this.logger.error(
            `State change request (${
              state.name
            }) failed: no response (${TestTimer.formattedDiff(
              testSetupStartTime
            )})`,
            { indent: 2 }
          );
        } else {
          this.logger.error(
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
   */
  private async executeStateTeardown(): Promise<boolean> {
    const testTeardownStartTime = process.hrtime();

    try {
      this.logger.log("Performing state teardown request", { indent: 1 });
      await axios.post(`${this.config.baseStateUrl}/teardown`);
      this.logger.success(
        `State teardown request success (${TestTimer.formattedDiff(
          testTeardownStartTime
        )})`,
        { indent: 2 }
      );
      return true;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `State teardown request failed: received ${
            error.response.status
          } status (${TestTimer.formattedDiff(
            testTeardownStartTime
          )})\nReceived:\n${TestLogger.formatObject(error.response.data)}`,
          { indent: 2 }
        );
      } else if (error.request) {
        this.logger.error(
          `State teardown request failed: no response (${TestTimer.formattedDiff(
            testTeardownStartTime
          )})`,
          { indent: 2 }
        );
      } else {
        this.logger.error(
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
  private verifyStatus(
    test: TestDefinition,
    response: AxiosResponse<any>
  ): boolean {
    if (test.response.status === response.status) {
      this.logger.success("Status matched", { indent: 2 });
      return true;
    } else {
      this.logger.error(
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
  private verifyBody(
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
      this.logger.success("Body compliant", { indent: 2 });
      return true;
    }
    this.logger.error(
      `Body is not compliant: ${jsv.errorsText(
        validateFn.errors
      )}\nReceived:\n${TestLogger.formatObject(response.data)}`,
      { indent: 2 }
    );
    return false;
  }
}

export interface TestRunnerConfig {
  printer: TestPrinter;
  baseStateUrl: string;
  baseUrl: string;
  debugMode?: boolean;
}

export type TestPrinter = (message: string) => void;

interface AxiosHeaders {
  [key: string]: string;
}

interface GenericParams {
  [key: string]: any;
}
