import { Command, flags } from "@oclif/command";
import axios, { AxiosRequestConfig } from "axios";
import {
  ContractDefinition,
  EndpointDefinition,
  TestDefinition
} from "../../../lib/src/models/definitions";
import { valueFromDataExpression } from "../../../lib/src/utilities/data-expression-utils";
import { safeParse } from "../common/safe-parse";

const ARG_API = "spot_contract";

/**
 * oclif command to test a spot contract
 */
export default class Test extends Command {
  static description = "Test a Spot contract";

  static examples = ["$ spot test api.ts"];

  static args = [
    {
      name: ARG_API,
      required: true,
      description: "path to Spot contract",
      hidden: false
    }
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    url: flags.string({
      required: true,
      char: "u",
      description: "Base URL"
    })
  };

  async run() {
    const { args, flags } = this.parse(Test);
    const { url: baseUrl } = flags;
    const { definition } = safeParse.call(this, args[ARG_API]);

    (definition as ContractDefinition).endpoints.forEach(endpoint => {
      endpoint.tests.forEach(test => {
        const config = generateAxiosConfig(endpoint, test, baseUrl);
        axios.request(config).then(response => {
          // TODO: check the response
        });
      });
    });
  }
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
    method: endpoint.method
  };

  if (test.request) {
    config.headers = test.request.headers.reduce<AxiosHeaders>(
      (acc, header) => {
        acc[header.name] = valueFromDataExpression(header.expression);
        return acc;
      },
      {}
    );

    config.params = test.request.queryParams.reduce<AxiosParams>(
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

interface AxiosHeaders {
  [key: string]: string;
}

interface AxiosParams {
  [key: string]: any;
}
