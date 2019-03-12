import JsonSchemaValidator = require("ajv");
import {
  JsonSchemaType,
  jsonTypeSchema
} from "../../generators/contract/json-schema";
import { TypeNode } from "../../models/nodes";
import { DataExpression, DataType } from "../../models/types";
import { valueFromDataExpression } from "../../utilities/data-expression-utils";

export function verifyJsonSchema(
  dataType: DataType,
  data: DataExpression,
  typeStore: TypeNode[]
) {
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
  const valid = validateFn(valueFromDataExpression(data));
  if (!valid) {
    throw new Error(`Invalid: ${jsv.errorsText(validateFn.errors)}`);
  }
}
