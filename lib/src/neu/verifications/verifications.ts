import { JsonSchemaValidator } from "ajv";
import { AxiosResponse } from "axios";
import { Contract } from "../definitions";
import { generateJsonSchemaType } from "../generators/json-schema-generator";
import { TypeTable } from "../types";
import { Options } from "./options";

function verifyContract(contract: Contract, options: Options) {}

/**
 * Check if an exios response body matches the expected body of an expected response definition.
 *
 * @param expectedResponse expected response
 * @param response axios response
 * @param typeStore reference type definitions
 */
function verifyBody(
  expectedBody: string,
  response: AxiosResponse<any>,
  typeStore: TypeTable
): boolean {
  if (!expectedBody) {
    return true;
  }

  const jsv = new JsonSchemaValidator();
  const schema = {
    ...generateJsonSchemaType(expectedBody),
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
