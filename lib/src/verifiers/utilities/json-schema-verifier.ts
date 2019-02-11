import {
  JsonSchemaType,
  jsonTypeSchema
} from "../../generators/contract/json-schema";
import { TypeNode } from "../../models/nodes";
import { DataExpression, DataType, TypeKind } from "../../models/types";
import Ajv = require("ajv");

export function verifyJsonSchema(
  dataType: DataType,
  data: DataExpression,
  typeStore: TypeNode[]
) {
  const ajv = new Ajv();
  const schema = {
    ...jsonTypeSchema(dataType),
    definitions: typeStore.reduce<{ [key: string]: JsonSchemaType }>(
      (defAcc, typeNode) => {
        return { [typeNode.name]: jsonTypeSchema(typeNode.type), ...defAcc };
      },
      {}
    )
  };
  const validateFn = ajv.compile(schema);
  const valid = validateFn(dataExpressionToJson(data));
  if (!valid) {
    throw new Error(`Invalid: ${ajv.errorsText(validateFn.errors)}`);
  }
}

export function dataExpressionToJson(data: DataExpression): any {
  switch (data.kind) {
    case TypeKind.NULL:
      return null;
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
      return data.value;
    case TypeKind.ARRAY:
      return data.elements.reduce<Array<any>>(
        (arrayAcc, element) => arrayAcc.concat(dataExpressionToJson(element)),
        []
      );
    case TypeKind.OBJECT:
      return data.properties.reduce<object>((objAcc, property) => {
        return {
          [property.name]: dataExpressionToJson(property.expression),
          ...objAcc
        };
      }, {});
    default:
      throw new Error("unexpected data expression");
  }
}
